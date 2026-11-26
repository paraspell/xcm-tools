import { Pair } from '@crypto-dex-sdk/amm';
import { ParachainId } from '@crypto-dex-sdk/chain';
import { Amount, Token } from '@crypto-dex-sdk/currency';
import {
  addressToNodeCurrency,
  PAIR_ADDRESSES,
  uniqePairKey,
} from '@crypto-dex-sdk/parachains-bifrost';
import { WrappedTokenInfo } from '@crypto-dex-sdk/token-lists';
import { RoutingResolutionError } from '@paraspell/sdk-core';
import type { ApiPromise } from '@polkadot/api';
import { describe, expect, it, vi } from 'vitest';

import {
  findToken,
  getBestTrade,
  getFilteredPairs,
  getTokenMap,
  selectPairs,
} from './bifrostUtils';

const CHAIN_ID = ParachainId.BIFROST_POLKADOT;
const tokenMap = getTokenMap('BifrostPolkadot', CHAIN_ID);

const BNC = new Token(findToken(tokenMap, 'BNC') as WrappedTokenInfo);
const DOT = new Token(findToken(tokenMap, 'DOT') as WrappedTokenInfo);
const OTHER = new Token(
  Object.values(tokenMap).find(
    (token) => token.symbol !== 'BNC' && token.symbol !== 'DOT',
  ) as WrappedTokenInfo,
);
const POOL = PAIR_ADDRESSES[uniqePairKey(BNC, DOT)];

const nativeReserve = (free: string) => ({ isEmpty: false, data: { free } });
const tokenReserve = (free: string) => ({ isEmpty: false, free });

const createApi = (reserves: unknown[] | Error) => {
  const queryMulti =
    reserves instanceof Error
      ? vi.fn().mockRejectedValue(reserves)
      : vi.fn().mockResolvedValue(reserves);

  const api = {
    query: {
      system: { account: 'system.account' },
      tokens: { accounts: 'tokens.accounts' },
    },
    queryMulti,
  } as unknown as ApiPromise;

  return { api, queryMulti };
};

describe('getTokenMap', () => {
  it('returns the Bifrost tokens keyed by address', () => {
    const tokens = Object.values(tokenMap);

    expect(tokens.length).toBeGreaterThan(0);
    tokens.forEach((token) => {
      expect(token).toBeInstanceOf(WrappedTokenInfo);
      expect(token.chainId).toBe(CHAIN_ID);
      expect(tokenMap[token.address]).toBe(token);
    });
  });

  it('returns an empty map when the chain id does not match the token list', () => {
    expect(getTokenMap('BifrostPolkadot', ParachainId.BIFROST_KUSAMA)).toEqual({});
  });

  it('throws for a chain without a Bifrost token list', () => {
    expect(() => getTokenMap('Acala', 2000)).toThrow(RoutingResolutionError);
  });
});

describe('findToken', () => {
  it('returns the token with a matching symbol', () => {
    expect(findToken(tokenMap, 'DOT')?.address).toBe(DOT.address);
  });

  it('returns undefined if the token is not found', () => {
    expect(findToken(tokenMap, 'NOT_FOUND')).toBeUndefined();
  });
});

describe('getFilteredPairs', () => {
  it('returns no pairs without querying the chain when no pool is known', async () => {
    const { api, queryMulti } = createApi([]);

    const pairs = await getFilteredPairs(api, CHAIN_ID, [[BNC, BNC]]);

    expect(pairs).toEqual([]);
    expect(queryMulti).not.toHaveBeenCalled();
  });

  it('builds pairs from reserves, reading native balances from system.account', async () => {
    const { api, queryMulti } = createApi([nativeReserve('1000'), tokenReserve('2000')]);

    const pairs = await getFilteredPairs(api, CHAIN_ID, [[BNC, DOT]]);

    expect(queryMulti).toHaveBeenCalledWith([
      ['system.account', POOL.account],
      ['tokens.accounts', [POOL.account, addressToNodeCurrency(DOT.address)]],
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toBeInstanceOf(Pair);
    expect(pairs[0].reserveOf(BNC).quotient.toString()).toBe('1000');
    expect(pairs[0].reserveOf(DOT).quotient.toString()).toBe('2000');
  });

  it('queries each pool only once when combinations repeat', async () => {
    const { api, queryMulti } = createApi([nativeReserve('1000'), tokenReserve('2000')]);

    await getFilteredPairs(api, CHAIN_ID, [
      [BNC, DOT],
      [DOT, BNC],
    ]);

    expect(queryMulti.mock.calls[0][0]).toHaveLength(2);
  });

  it('skips pools with empty reserves', async () => {
    const { api } = createApi([nativeReserve('1000'), { isEmpty: true, free: '0' }]);

    expect(await getFilteredPairs(api, CHAIN_ID, [[BNC, DOT]])).toEqual([]);
  });

  it('propagates RPC errors', async () => {
    const { api } = createApi(new Error('RPC unavailable'));

    await expect(getFilteredPairs(api, CHAIN_ID, [[BNC, DOT]])).rejects.toThrow('RPC unavailable');
  });
});

describe('selectPairs', () => {
  const pair = new Pair(
    Amount.fromRawAmount(BNC, '1000'),
    Amount.fromRawAmount(DOT, '2000'),
    POOL.address,
  );

  it('keeps pools that belong to the given combinations', () => {
    expect(selectPairs([pair], CHAIN_ID, [[DOT, BNC]])).toEqual([pair]);
  });

  it('drops pools outside the given combinations', () => {
    expect(selectPairs([pair], CHAIN_ID, [[BNC, OTHER]])).toEqual([]);
  });
});

describe('getBestTrade', () => {
  it('returns the best trade through the available pools', () => {
    const pair = new Pair(
      Amount.fromRawAmount(BNC, '1000000000000000'),
      Amount.fromRawAmount(DOT, '1000000000000000'),
      POOL.address,
    );

    const trade = getBestTrade(CHAIN_ID, [pair], Amount.fromRawAmount(BNC, '1000000000'), DOT);

    expect(trade.outputAmount.currency.equals(DOT)).toBe(true);
    expect(trade.outputAmount.greaterThan(0)).toBe(true);
  });

  it('throws when there are no pools', () => {
    expect(() => getBestTrade(CHAIN_ID, [], Amount.fromRawAmount(BNC, '1000'), DOT)).toThrow(
      'Trade not found',
    );
  });

  it('throws when the pools do not connect the tokens', () => {
    const pair = new Pair(
      Amount.fromRawAmount(BNC, '1000000000000000'),
      Amount.fromRawAmount(DOT, '1000000000000000'),
      POOL.address,
    );

    expect(() =>
      getBestTrade(CHAIN_ID, [pair], Amount.fromRawAmount(BNC, '1000000000'), OTHER),
    ).toThrow('Trade not found');
  });
});
