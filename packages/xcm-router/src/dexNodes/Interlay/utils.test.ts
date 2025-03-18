import type { CurrencyExt, ForeignAsset, InterBtcApi } from 'inter-exchange';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCurrency } from './utils';

describe('getCurrency', () => {
  let interBTC: InterBtcApi;

  beforeEach(() => {
    interBTC = {
      getRelayChainCurrency: vi.fn(),
      getGovernanceCurrency: vi.fn(),
      getWrappedCurrency: vi.fn(),
      assetRegistry: {
        getForeignAsset: vi.fn(),
      },
    } as unknown as InterBtcApi;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return relay chain currency for symbol DOT', async () => {
    const expectedCurrency = { name: 'DOT Currency' } as CurrencyExt;

    const spy = vi.spyOn(interBTC, 'getRelayChainCurrency').mockResolvedValue(expectedCurrency);

    const result = await getCurrency(interBTC, { symbol: 'DOT' });

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(expectedCurrency);
  });

  it('should return relay chain currency for symbol KSM', async () => {
    const expectedCurrency = { name: 'KSM Currency' } as CurrencyExt;

    const spy = vi.spyOn(interBTC, 'getRelayChainCurrency').mockResolvedValue(expectedCurrency);

    const result = await getCurrency(interBTC, { symbol: 'KSM' });

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(expectedCurrency);
  });

  it('should return governance currency for symbol INTR', async () => {
    const expectedCurrency = { name: 'INTR Currency' } as CurrencyExt;

    const spy = vi.spyOn(interBTC, 'getGovernanceCurrency').mockResolvedValue(expectedCurrency);

    const result = await getCurrency(interBTC, { symbol: 'INTR' });

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(expectedCurrency);
  });

  it('should return governance currency for symbol KINT', async () => {
    const expectedCurrency = { name: 'KINT Currency' } as CurrencyExt;
    const spy = vi.spyOn(interBTC, 'getGovernanceCurrency').mockResolvedValue(expectedCurrency);

    const result = await getCurrency(interBTC, { symbol: 'KINT' });

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(expectedCurrency);
  });

  it('should return wrapped currency for symbol IBTC', async () => {
    const expectedCurrency = { name: 'IBTC Currency' } as CurrencyExt;

    const spy = vi.spyOn(interBTC, 'getWrappedCurrency').mockResolvedValue(expectedCurrency);

    const result = await getCurrency(interBTC, { symbol: 'IBTC' });

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(expectedCurrency);
  });

  it('should return wrapped currency for symbol KBTC', async () => {
    const expectedCurrency = { name: 'KBTC Currency' } as CurrencyExt;

    const spy = vi.spyOn(interBTC, 'getWrappedCurrency').mockResolvedValue(expectedCurrency);

    const result = await getCurrency(interBTC, { symbol: 'KBTC' });

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(expectedCurrency);
  });

  it('should return null if asset not found', async () => {
    const result = await getCurrency(interBTC, { symbol: 'UNKNOWN' });
    expect(result).toBeNull();
  });

  it('should return foreign asset for symbol with valid asset ID', async () => {
    const expectedCurrency = { name: 'USDT' } as ForeignAsset;

    const spy = vi
      .spyOn(interBTC.assetRegistry, 'getForeignAsset')
      .mockResolvedValue(expectedCurrency);

    const result = await getCurrency(interBTC, { symbol: 'USDT', assetId: '123' });

    expect(spy).toHaveBeenCalledWith(123);
    expect(result).toBe(expectedCurrency);
  });

  it('should return foreign asset for currency with ID', async () => {
    const expectedCurrency = { name: 'Some Currency' } as ForeignAsset;

    const spy = vi
      .spyOn(interBTC.assetRegistry, 'getForeignAsset')
      .mockResolvedValue(expectedCurrency);

    const result = await getCurrency(interBTC, { symbol: 'HDX', assetId: '456' });

    expect(spy).toHaveBeenCalledWith(456);
    expect(result).toBe(expectedCurrency);
  });
});
