import BigNumber from 'bignumber.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeNode from '../dexNodes/DexNode';
import type { TCommonTransferOptions } from '../types';
import { MOCK_TRANSFER_OPTIONS } from '../utils/testUtils';
import { calculateFromExchangeFee } from './createSwapTx';
import { selectBestExchange } from './selectBestExchange';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';

vi.mock('./createSwapTx', () => ({
  calculateFromExchangeFee: vi.fn(),
}));

vi.mock('./selectBestExchangeCommon', () => ({
  selectBestExchangeCommon: vi.fn(),
}));

const dummyDex = (): ExchangeNode =>
  ({
    node: 'Acala',
    exchangeNode: 'AcalaDex',
    createApiInstance: vi.fn().mockResolvedValue({}),
    createApiInstancePapi: vi.fn().mockResolvedValue({}),
    swapCurrency: vi.fn().mockResolvedValue({ amountOut: '123' }),
  }) as unknown as ExchangeNode;

const fee = new BigNumber(10);

describe('selectBestExchange', () => {
  let baseOptions: TCommonTransferOptions;

  beforeEach(() => {
    vi.resetAllMocks();

    baseOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: { id: '18446744073709551619' },
      currencyTo: { symbol: 'HDX' },
      exchange: 'AcalaDex',
    };

    // fee helper always returns the same deterministic value
    vi.mocked(calculateFromExchangeFee).mockResolvedValue(fee);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resolves with the “best” exchange and forwards the fee to swapCurrency', async () => {
    const dex = dummyDex();

    vi.mocked(selectBestExchangeCommon).mockImplementation(async (_options, candidateFn) => {
      await candidateFn(
        dex,
        baseOptions.currencyFrom as never,
        baseOptions.currencyTo as never,
        _options,
      );

      return dex;
    });

    const spy = vi.spyOn(dex, 'swapCurrency');

    const result = await selectBestExchange(baseOptions);

    expect(selectBestExchangeCommon).toHaveBeenCalledWith(baseOptions, expect.any(Function));

    expect(result).toBe(dex);

    expect(calculateFromExchangeFee).toHaveBeenCalledTimes(1);

    expect(vi.mocked(spy).mock.calls[0][2]).toBe(fee);
  });

  it('propagates errors from selectBestExchangeCommon (e.g. unsupported asset)', async () => {
    const failingOptions: TCommonTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: { id: 'xyz' },
      currencyTo: { id: '1000099' },
      exchange: 'AcalaDex',
    };

    const err = new Error(
      `Currency ${JSON.stringify(failingOptions.currencyFrom)} is not supported`,
    );

    vi.mocked(selectBestExchangeCommon).mockRejectedValue(err);

    await expect(selectBestExchange(failingOptions)).rejects.toThrow(err);
  });
});
