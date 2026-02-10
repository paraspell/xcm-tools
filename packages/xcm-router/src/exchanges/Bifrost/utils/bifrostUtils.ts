/*
Code partially inspired by https://app.zenlink.pro/
*/

import { Pair, type Pool, Trade } from '@crypto-dex-sdk/amm';
import { ParachainId } from '@crypto-dex-sdk/chain';
import { Amount, type Currency, type Token, type Type } from '@crypto-dex-sdk/currency';
import { type TokenMap as SdkTokenMap } from '@crypto-dex-sdk/currency';
import { addressToZenlinkAssetId } from '@crypto-dex-sdk/format';
import {
  addressToNodeCurrency,
  isNativeCurrency,
  PAIR_ADDRESSES,
} from '@crypto-dex-sdk/parachains-bifrost';
import { type PairPrimitivesAssetId } from '@crypto-dex-sdk/parachains-bifrost';
import {
  DEFULT_TOKEN_LIST_MAP,
  type TokenList,
  WrappedTokenInfo,
} from '@crypto-dex-sdk/token-lists';
import { RoutingResolutionError, type TChain } from '@paraspell/sdk';
import { type ApiPromise } from '@polkadot/api';
import { type QueryableStorageEntry } from '@polkadot/api/types';
import { type OrmlTokensAccountData } from '@zenlink-types/bifrost/interfaces';

import { fetchCallMulti } from './useCallMulti';

export type TokenMap = Readonly<Record<string, { token: WrappedTokenInfo; list?: TokenList }>>;
export type ChainTokenMap = Readonly<Record<number, TokenMap>>;
export type TokenAddressMap = ChainTokenMap;

type PairsReturn = Array<[PairState, Pair | null]>;

export const getPairs = (
  chainId: ParachainId | undefined,
  currencies: Array<[Currency | undefined, Currency | undefined]>,
) =>
  currencies
    .filter((currencies): currencies is [Type, Type] => {
      const [currencyA, currencyB] = currencies;
      return Boolean(
        chainId &&
        (chainId === ParachainId.BIFROST_KUSAMA || chainId === ParachainId.BIFROST_POLKADOT) &&
        currencyA &&
        currencyB &&
        currencyA.chainId === currencyB.chainId &&
        chainId === currencyA.chainId &&
        !currencyA.wrapped.equals(currencyB.wrapped),
      );
    })
    .reduce<[Token[], Token[], PairPrimitivesAssetId[]]>(
      (acc, [currencyA, currencyB]) => {
        const [token0, token1] = currencyA.wrapped.sortsBefore(currencyB.wrapped)
          ? [currencyA.wrapped, currencyB.wrapped]
          : [currencyB.wrapped, currencyA.wrapped];

        acc[0].push(token0);
        acc[1].push(token1);
        acc[2].push([
          addressToZenlinkAssetId(token0.address),
          addressToZenlinkAssetId(token1.address),
        ]);
        return acc;
      },
      [[], [], []],
    );

export const uniqePairKey = (tokenA: Token, tokenB: Token): string =>
  `${tokenA.address}-${tokenB.address}`;

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export const fetchPairs = async (
  api: ApiPromise,
  chainId: number | undefined,
  currencies: Array<[Currency | undefined, Currency | undefined]>,
): Promise<PairsReturn> => {
  const [tokensA, tokensB] = getPairs(chainId, currencies);

  const [validTokensA, validTokensB, reservesCalls] = tokensA.reduce<
    [Token[], Token[], Array<[QueryableStorageEntry<'promise'>, ...unknown[]]>]
  >(
    (acc, tokenA, i) => {
      const tokenB = tokensB[i];
      const pairKey = uniqePairKey(tokenA, tokenB);
      const pairAccount = PAIR_ADDRESSES[pairKey]?.account;
      if (pairAccount && api) {
        acc[0].push(tokenA);
        acc[1].push(tokenB);
        if (isNativeCurrency(tokenA)) acc[2].push([api.query.system.account, pairAccount]);
        else
          acc[2].push([
            api.query.tokens.accounts,
            [pairAccount, addressToNodeCurrency(tokenA.address)],
          ]);

        if (isNativeCurrency(tokenB)) acc[2].push([api.query.system.account, pairAccount]);
        else
          acc[2].push([
            api.query.tokens.accounts,
            [pairAccount, addressToNodeCurrency(tokenB.address)],
          ]);
      }
      return acc;
    },
    [[], [], []],
  );

  const reserves = await fetchCallMulti<
    Array<
      OrmlTokensAccountData & {
        data: OrmlTokensAccountData;
      }
    >
  >({
    api,
    calls: reservesCalls,
    options: { defaultValue: [] },
  });

  if (reservesCalls.length === 0) return [[PairState.NOT_EXISTS, null]];
  if (!reserves.length || reserves.length !== validTokensA.length * 2) {
    return validTokensA.map(() => [PairState.LOADING, null]);
  }

  return validTokensA.map((tokenA, i) => {
    const tokenB = validTokensB[i];
    if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null];

    const pairKey = uniqePairKey(tokenA, tokenB);
    const reserve0 = reserves[i * 2];
    const reserve1 = reserves[i * 2 + 1];
    const pairAddress = PAIR_ADDRESSES[pairKey]?.address;
    if (!reserve0 || !reserve1 || reserve0.isEmpty || reserve1.isEmpty || !pairAddress)
      return [PairState.NOT_EXISTS, null];

    return [
      PairState.EXISTS,
      new Pair(
        Amount.fromRawAmount(tokenA, (reserve0.data || reserve0).free.toString()),
        Amount.fromRawAmount(tokenB, (reserve1.data || reserve1).free.toString()),
        pairAddress,
      ),
    ];
  });
};

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>;
};

export const tokensToChainTokenMap = (tokens: TokenList): ChainTokenMap => {
  const [list, infos] = [tokens, tokens.tokens];
  const map = infos.reduce<Mutable<ChainTokenMap>>((map, info) => {
    const token = new WrappedTokenInfo(info, list);
    if (map[token.chainId]?.[token.address] !== undefined) {
      // eslint-disable-next-line no-console
      console.warn(`Duplicate token skipped: ${token.address}`);
      return map;
    }
    if (!map[token.chainId]) map[token.chainId] = {};

    map[token.chainId][token.address] = { token, list };
    return map;
  }, {}) as ChainTokenMap;
  return map;
};

export const getTokenMap = (chain: TChain, chainId: number): Record<string, Token> => {
  const map =
    DEFULT_TOKEN_LIST_MAP[chain === 'BifrostPolkadot' ? 'bifrost-polkadot' : 'bifrost-kusama'];

  const tokenMap = tokensToChainTokenMap(map);

  return Object.keys(tokenMap[chainId] ?? {}).reduce<Record<string, Token>>((newMap, address) => {
    newMap[address] = tokenMap[chainId][address].token;
    return newMap;
  }, {});
};

export const getFilteredPairs = async (
  api: ApiPromise,
  chainId: number,
  currencies: Array<[Currency | undefined, Currency | undefined]>,
) => {
  const pairs = await fetchPairs(api, chainId, currencies);

  return Object.values(
    pairs
      .filter((result): result is [PairState.EXISTS, Pair] =>
        Boolean(result[0] === PairState.EXISTS && result[1]),
      )
      .map(([, pair]) => pair),
  );
};

export const getBestTrade = (
  chainId: number,
  pairs: Pool[],
  amountIn: Amount<Currency>,
  currencyOut: Currency,
) => {
  const trades = Trade.bestTradeExactIn(chainId, pairs, [], amountIn, currencyOut);

  if (trades.length < 1) {
    throw new RoutingResolutionError('Trade not found');
  }

  return trades[0];
};

export const findToken = (tokenMap: SdkTokenMap, symbol: string): Token | undefined =>
  Object.values(tokenMap).find((item) => item.wrapped.symbol === symbol)?.wrapped;
