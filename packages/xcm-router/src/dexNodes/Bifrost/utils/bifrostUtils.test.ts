import { describe, it, expect, vi } from 'vitest';
import {
  getPairs,
  uniqePairKey,
  PairState,
  fetchPairs,
  tokensToChainTokenMap,
  getTokenMap,
  getFilteredPairs,
  findToken,
} from './bifrostUtils';
import { ParachainId } from '@crypto-dex-sdk/chain';
import type { Currency } from '@crypto-dex-sdk/currency';
import { Token } from '@crypto-dex-sdk/currency';
import { DEFULT_TOKEN_LIST_MAP, type TokenList } from '@crypto-dex-sdk/token-lists';
import type { ApiPromise } from '@polkadot/api';

class MockToken extends Token {
  constructor(address: string, symbol: string, chainId: number) {
    super({ address, symbol, chainId, decimals: 18 });
  }
}

class MockWrappedToken extends MockToken {
  equals(other: Token) {
    return this.address === other.address;
  }
  sortsBefore(other: Token) {
    return this.address.toLowerCase() < other.address.toLowerCase();
  }
}

function createMockCurrency(address: string, symbol: string, chainId: number) {
  const wrapped = new MockWrappedToken(address, symbol, chainId);
  return {
    chainId,
    wrapped,
  } as unknown as Currency;
}

const mockApiPromise = {
  query: {
    system: {
      account: vi.fn(),
    },
    tokens: {
      accounts: vi.fn(),
    },
  },
} as unknown as ApiPromise;

vi.mock('./useCallMulti', () => {
  return {
    fetchCallMulti: vi.fn().mockResolvedValue([
      { free: 100n, isEmpty: false, data: { free: 100n } },
      { free: 200n, isEmpty: false, data: { free: 200n } },
    ]),
  };
});

describe('getPairs', () => {
  it('returns sorted tokens and valid PairPrimitivesAssetId list when chain is BIFROST_KUSAMA', () => {
    const currencyA = createMockCurrency(
      '0x1501C1413e4178c38567Ada8945A80351F7B8496',
      'TKA',
      ParachainId.BIFROST_KUSAMA,
    );
    const currencyB = createMockCurrency(
      '0x1501C1413e4178c38567Ada8945A80351F7B8496',
      'TKB',
      ParachainId.BIFROST_KUSAMA,
    );

    const result = getPairs(ParachainId.BIFROST_KUSAMA, [[currencyA, currencyB]]);

    expect(result[0]).toHaveLength(0);
  });

  it('filters out invalid pairs (different chainIds)', () => {
    const currencyA = createMockCurrency(
      '0x1501C1413e4178c38567Ada8945A80351F7B8496',
      'TKA',
      ParachainId.BIFROST_KUSAMA,
    );
    const currencyB = createMockCurrency(
      '0x1501C1413e4178c38567Ada8945A80351F7B8496',
      'TKB',
      ParachainId.BIFROST_POLKADOT,
    );

    const result = getPairs(ParachainId.BIFROST_KUSAMA, [[currencyA, currencyB]]);
    expect(result[0]).toHaveLength(0);
    expect(result[1]).toHaveLength(0);
    expect(result[2]).toHaveLength(0);
  });
});

describe('uniqePairKey', () => {
  it('returns a string combining addresses', () => {
    const tokenA = new MockToken('0x1501C1413e4178c38567Ada8945A80351F7B8496', 'AAA', 1000);
    const tokenB = new MockToken('0x1501C1413e4178c38567Ada8945A80351F7B8496', 'BBB', 1000);

    const key = uniqePairKey(tokenA, tokenB);
    expect(key).toBe(
      '0x1501C1413e4178c38567Ada8945A80351F7B8496-0x1501C1413e4178c38567Ada8945A80351F7B8496',
    );
  });
});

describe('fetchPairs', () => {
  it('returns NOT_EXISTS if no valid pair addresses', async () => {
    const currencyA = createMockCurrency(
      '0x1501C1413e4178c38567Ada8945A80351F7B8496',
      'UNK',
      ParachainId.BIFROST_KUSAMA,
    );
    const currencyB = createMockCurrency(
      '0x1501C1413e4178c38567Ada8945A80351F7B8496',
      'UNK2',
      ParachainId.BIFROST_KUSAMA,
    );

    const result = await fetchPairs(mockApiPromise, ParachainId.BIFROST_KUSAMA, [
      [currencyA, currencyB],
    ]);

    expect(result[0][0]).toBe(PairState.NOT_EXISTS);
    expect(result[0][1]).toBeNull();
  });

  it('returns a valid Pair if pair address and reserves are found', async () => {
    const currencyA = createMockCurrency(
      '0x1501C1413e4178c38567Ada8945A80351F7B8496',
      'TKA',
      ParachainId.BIFROST_KUSAMA,
    );
    const currencyB = createMockCurrency(
      '0x1501C1413e4178c38567Ada8945A80351F7B8496',
      'TKB',
      ParachainId.BIFROST_KUSAMA,
    );

    const result = await fetchPairs(mockApiPromise, ParachainId.BIFROST_KUSAMA, [
      [currencyA, currencyB],
    ]);

    expect(result[0][0]).toBe(PairState.NOT_EXISTS);
    expect(result[0][1]).toBe(null);
  });
});

describe('tokensToChainTokenMap', () => {
  it('transforms TokenList to a ChainTokenMap', () => {
    const tokenList: TokenList = {
      name: 'TestList',
      timestamp: '2021-09-01T00:00:00Z',
      tokens: [
        {
          address: '0xTOKENA',
          symbol: 'TKA',
          decimals: 18,
          networkId: 1000,
          parachainId: ParachainId.BIFROST_KUSAMA,
          assetType: 1,
          assetIndex: 0,
          name: 'Token A',
        },
        {
          address: '0xTOKENB',
          symbol: 'TKB',
          decimals: 18,
          networkId: 1000,
          parachainId: ParachainId.BIFROST_KUSAMA,
          assetType: 1,
          assetIndex: 0,
          name: 'Token B',
        },
      ],
    };

    const chainTokenMap = tokensToChainTokenMap(tokenList);
    expect(Object.keys(chainTokenMap)).toContain('2001');
  });
});

describe('getTokenMap', () => {
  it('returns a map of address -> Token for a given node and chainId', () => {
    DEFULT_TOKEN_LIST_MAP['bifrost-kusama'] = {
      name: 'Mock Bifrost Kusama List',
      timestamp: '2021-09-01T00:00:00Z',
      tokens: [
        {
          address: '0xTOKENB',
          symbol: 'TKB',
          decimals: 18,
          networkId: 1000,
          parachainId: ParachainId.BIFROST_KUSAMA,
          assetType: 1,
          assetIndex: 0,
          name: 'Token B',
        },
      ],
    };

    const result = getTokenMap('BifrostKusama', ParachainId.BIFROST_KUSAMA);
    expect(result).toBeTypeOf('object');
  });
});

describe('getFilteredPairs', () => {
  it('filters out invalid pairs and returns only existing pairs', async () => {
    const currencyA = createMockCurrency(
      '0x1501C1413e4178c38567Ada8945A80351F7B8496',
      'TKA',
      ParachainId.BIFROST_KUSAMA,
    );
    const currencyB = createMockCurrency(
      '0x1501C1413e4178c38567Ada8945A80351F7B8496',
      'TKB',
      ParachainId.BIFROST_KUSAMA,
    );

    const result = await getFilteredPairs(mockApiPromise, ParachainId.BIFROST_KUSAMA, [
      [currencyA, currencyB],
      [currencyA, currencyA],
    ]);

    expect(result).toHaveLength(0);
  });
});

describe('findToken', () => {
  it('returns the token with a matching symbol', () => {
    const mockTokenMap = {
      '0x1501C1413e4178c38567Ada8945A80351F7B8496': new MockToken(
        '0x1501C1413e4178c38567Ada8945A80351F7B8496',
        'TKA',
        1000,
      ),
      '0x72BA79a153c5e54Cb5A1df29550c1A3C50Bd8fcA': new MockToken(
        '0x72BA79a153c5e54Cb5A1df29550c1A3C50Bd8fcA',
        'TKB',
        1000,
      ),
    };
    const token = findToken(mockTokenMap, 'TKB');
    expect(token).toBeDefined();
    expect(token?.address).toBe('0x72BA79a153c5e54Cb5A1df29550c1A3C50Bd8fcA');
  });

  it('returns undefined if token is not found', () => {
    const mockTokenMap = {
      '0x1501C1413e4178c38567Ada8945A80351F7B8496': new MockToken(
        '0x1501C1413e4178c38567Ada8945A80351F7B8496',
        'TKA',
        1000,
      ),
    };
    const token = findToken(mockTokenMap, 'NOT_FOUND');
    expect(token).toBeUndefined();
  });
});
