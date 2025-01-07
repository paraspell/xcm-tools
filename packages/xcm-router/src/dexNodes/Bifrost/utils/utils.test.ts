import { describe, it, expect, vi, beforeEach } from 'vitest';
import BigNumber from 'bignumber.js';
import { Native } from '@crypto-dex-sdk/currency';
import { getBestTrade } from './bifrostUtils';
import type { Token } from '@crypto-dex-sdk/currency';
import type { Pool, Trade } from '@crypto-dex-sdk/amm';
import { convertAmount } from './utils';

vi.mock('@crypto-dex-sdk/currency', async () => {
  const actual = await vi.importActual('@crypto-dex-sdk/currency');
  return {
    ...actual,
    Native: {
      onChain: vi.fn(),
    },
    Amount: {
      fromRawAmount: vi.fn(),
    },
  };
});

vi.mock('./bifrostUtils', () => ({
  getBestTrade: vi.fn(),
}));

describe('convertAmount', () => {
  const mockChainId = 1;
  const mockNativeToken = {
    symbol: 'NATIVE',
    decimals: 12,
  } as Native;

  const mockToken = {
    symbol: 'FOO',
    decimals: 6,
  } as Token;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(Native, 'onChain').mockReturnValue(mockNativeToken);
  });

  it('returns the original feeAmount if token is the same as native', () => {
    vi.spyOn(Native, 'onChain').mockReturnValue({
      symbol: 'FOO',
      decimals: 6,
    } as Native);

    const feeAmount = new BigNumber('123456');
    const result = convertAmount(feeAmount, mockToken, mockChainId, []);
    expect(result.toString()).toBe('123456');
    expect(getBestTrade).not.toHaveBeenCalled();
  });

  it('converts feeAmount when token is different from native', () => {
    const feeAmount = BigNumber(1000);
    const mockPairs: Pool[] = [];

    vi.mocked(getBestTrade).mockReturnValue({
      executionPrice: {
        toFixed: vi.fn().mockReturnValue('2'),
      },
    } as unknown as Trade);

    const result = convertAmount(feeAmount, mockToken, mockChainId, mockPairs);

    expect(result.toString()).toBe('0.0005');

    expect(getBestTrade).toHaveBeenCalledWith(mockChainId, mockPairs, undefined, mockNativeToken);
  });

  it('handles different execution prices correctly', () => {
    const feeAmount = new BigNumber('5000');
    const mockPairs: Pool[] = [];

    vi.mocked(getBestTrade).mockReturnValue({
      executionPrice: {
        toFixed: vi.fn().mockReturnValue('0.5'), // Price is 0.5
      },
    } as unknown as Trade);

    const result = convertAmount(feeAmount, mockToken, mockChainId, mockPairs);

    expect(result.toString()).toBe('0.01');
  });
});
