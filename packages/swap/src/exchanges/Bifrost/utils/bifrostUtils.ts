/*
Code partially inspired by https://app.zenlink.pro/
*/

import { Pair, type Pool, Trade } from '@crypto-dex-sdk/amm';
import { Amount, type Currency, type Token } from '@crypto-dex-sdk/currency';
import {
  addressToNodeCurrency,
  getPairs,
  isNativeCurrency,
  PAIR_ADDRESSES,
  uniqePairKey,
} from '@crypto-dex-sdk/parachains-bifrost';
import { DEFULT_TOKEN_LIST_MAP, WrappedTokenInfo } from '@crypto-dex-sdk/token-lists';
import { isSymbolMatch, RoutingResolutionError, type TChain } from '@paraspell/sdk-core';
import type { ApiPromise } from '@polkadot/api';
import type { QueryableStorageMultiArg } from '@polkadot/api/types';
import type { AccountInfo } from '@polkadot/types/interfaces';
import type { OrmlTokensAccountData } from '@zenlink-types/bifrost/interfaces';

export type TBifrostTokenMap = Record<string, WrappedTokenInfo>;

type TCurrencyPair = [Currency | undefined, Currency | undefined];

type TReserve = AccountInfo | OrmlTokensAccountData;

const TOKEN_LIST_NAMES: Partial<Record<TChain, string>> = {
  BifrostPolkadot: 'bifrost-polkadot',
  BifrostKusama: 'bifrost-kusama',
};

export const getTokenMap = (chain: TChain, chainId: number): TBifrostTokenMap => {
  const listName = TOKEN_LIST_NAMES[chain];
  if (!listName) throw new RoutingResolutionError(`Bifrost token list not found for ${chain}`);

  const list = DEFULT_TOKEN_LIST_MAP[listName];

  return Object.fromEntries(
    list.tokens
      .map((info) => new WrappedTokenInfo(info, list))
      .filter((token) => token.chainId === chainId)
      .map((token) => [token.address, token]),
  );
};

export const findToken = (tokenMap: TBifrostTokenMap, symbol: string) =>
  Object.values(tokenMap).find((token) => isSymbolMatch(token.symbol, symbol));

const balanceQuery = (
  api: ApiPromise,
  account: string,
  token: Token,
): QueryableStorageMultiArg<'promise'> =>
  isNativeCurrency(token)
    ? [api.query.system.account, account]
    : [api.query.tokens.accounts, [account, addressToNodeCurrency(token.address)]];

const freeBalance = (reserve: TReserve) =>
  ('data' in reserve ? reserve.data.free : reserve.free).toString();

export const getFilteredPairs = async (
  api: ApiPromise,
  chainId: number,
  currencies: TCurrencyPair[],
): Promise<Pair[]> => {
  const [tokensA, tokensB] = getPairs(chainId, currencies);

  const pools = new Map<
    string,
    { tokenA: Token; tokenB: Token; address: string; account: string }
  >();
  tokensA.forEach((tokenA, i) => {
    const tokenB = tokensB[i];
    const key = uniqePairKey(tokenA, tokenB);
    const pool = PAIR_ADDRESSES[key];
    if (pool) pools.set(key, { tokenA, tokenB, ...pool });
  });

  if (pools.size === 0) return [];

  const poolList = Array.from(pools.values());
  const reserves = await api.queryMulti<TReserve[]>(
    poolList.flatMap(({ tokenA, tokenB, account }) => [
      balanceQuery(api, account, tokenA),
      balanceQuery(api, account, tokenB),
    ]),
  );

  return poolList.flatMap(({ tokenA, tokenB, address }, i) => {
    const reserveA = reserves[i * 2];
    const reserveB = reserves[i * 2 + 1];
    if (reserveA.isEmpty || reserveB.isEmpty) return [];

    return [
      new Pair(
        Amount.fromRawAmount(tokenA, freeBalance(reserveA)),
        Amount.fromRawAmount(tokenB, freeBalance(reserveB)),
        address,
      ),
    ];
  });
};

export const selectPairs = (pairs: Pair[], chainId: number, currencies: TCurrencyPair[]) => {
  const [tokensA, tokensB] = getPairs(chainId, currencies);
  const keys = new Set(tokensA.map((tokenA, i) => uniqePairKey(tokenA, tokensB[i])));
  return pairs.filter((pair) => keys.has(uniqePairKey(pair.token0, pair.token1)));
};

export const getBestTrade = (
  chainId: number,
  pairs: Pool[],
  amountIn: Amount<Currency>,
  currencyOut: Currency,
) => {
  const [bestTrade] = pairs.length
    ? Trade.bestTradeExactIn(chainId, pairs, [], amountIn, currencyOut)
    : [];
  if (!bestTrade) throw new RoutingResolutionError('Trade not found');
  return bestTrade;
};
