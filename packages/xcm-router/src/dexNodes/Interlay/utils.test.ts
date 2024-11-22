import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { InterBtcApi, CurrencyExt, ForeignAsset } from 'inter-exchange';
import type { TCurrencyCoreV1 } from '@paraspell/sdk';
import type { TNode } from '@paraspell/sdk';
import { getAssetId } from '@paraspell/sdk';
import { getCurrency } from './utils';

vi.mock('@paraspell/sdk', () => ({
  getAssetId: vi.fn(),
}));

describe('getCurrency', () => {
  let interBTC: InterBtcApi;
  let node: TNode;

  beforeEach(() => {
    interBTC = {
      getRelayChainCurrency: vi.fn(),
      getGovernanceCurrency: vi.fn(),
      getWrappedCurrency: vi.fn(),
      assetRegistry: {
        getForeignAsset: vi.fn(),
      },
    } as unknown as InterBtcApi;

    node = {} as TNode;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return relay chain currency for symbol DOT', async () => {
    const currency: TCurrencyCoreV1 = { symbol: 'DOT' };
    const expectedCurrency = { name: 'DOT Currency' } as CurrencyExt;

    const spy = vi.spyOn(interBTC, 'getRelayChainCurrency').mockResolvedValue(expectedCurrency);

    const result = await getCurrency(currency, interBTC, node);

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(expectedCurrency);
  });

  it('should return relay chain currency for symbol KSM', async () => {
    const currency: TCurrencyCoreV1 = { symbol: 'KSM' };
    const expectedCurrency = { name: 'KSM Currency' } as CurrencyExt;

    const spy = vi.spyOn(interBTC, 'getRelayChainCurrency').mockResolvedValue(expectedCurrency);

    const result = await getCurrency(currency, interBTC, node);

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(expectedCurrency);
  });

  it('should return governance currency for symbol INTR', async () => {
    const currency: TCurrencyCoreV1 = { symbol: 'INTR' };
    const expectedCurrency = { name: 'INTR Currency' } as CurrencyExt;

    const spy = vi.spyOn(interBTC, 'getGovernanceCurrency').mockResolvedValue(expectedCurrency);

    const result = await getCurrency(currency, interBTC, node);

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(expectedCurrency);
  });

  it('should return governance currency for symbol KINT', async () => {
    const currency: TCurrencyCoreV1 = { symbol: 'KINT' };
    const expectedCurrency = { name: 'KINT Currency' } as CurrencyExt;
    const spy = vi.spyOn(interBTC, 'getGovernanceCurrency').mockResolvedValue(expectedCurrency);

    const result = await getCurrency(currency, interBTC, node);

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(expectedCurrency);
  });

  it('should return wrapped currency for symbol IBTC', async () => {
    const currency: TCurrencyCoreV1 = { symbol: 'IBTC' };
    const expectedCurrency = { name: 'IBTC Currency' } as CurrencyExt;

    const spy = vi.spyOn(interBTC, 'getWrappedCurrency').mockResolvedValue(expectedCurrency);

    const result = await getCurrency(currency, interBTC, node);

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(expectedCurrency);
  });

  it('should return wrapped currency for symbol KBTC', async () => {
    const currency: TCurrencyCoreV1 = { symbol: 'KBTC' };
    const expectedCurrency = { name: 'KBTC Currency' } as CurrencyExt;

    const spy = vi.spyOn(interBTC, 'getWrappedCurrency').mockResolvedValue(expectedCurrency);

    const result = await getCurrency(currency, interBTC, node);

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(expectedCurrency);
  });

  it('should return null if getAssetId returns null', async () => {
    const currency: TCurrencyCoreV1 = { symbol: 'UNKNOWN' };
    const getAssetIdMock = vi.mocked(getAssetId);
    getAssetIdMock.mockReturnValue(null);

    const result = await getCurrency(currency, interBTC, node);

    expect(getAssetIdMock).toHaveBeenCalledWith(node, 'UNKNOWN');
    expect(result).toBeNull();
  });

  it('should return foreign asset for symbol with valid asset ID', async () => {
    const currency: TCurrencyCoreV1 = { symbol: 'USDT' };
    const getAssetIdMock = vi.mocked(getAssetId);
    getAssetIdMock.mockReturnValue('123');
    const expectedCurrency = { name: 'USDT Currency' } as ForeignAsset;

    const spy = vi
      .spyOn(interBTC.assetRegistry, 'getForeignAsset')
      .mockResolvedValue(expectedCurrency);

    const result = await getCurrency(currency, interBTC, node);

    expect(getAssetIdMock).toHaveBeenCalledWith(node, 'USDT');
    expect(spy).toHaveBeenCalledWith(123);
    expect(result).toBe(expectedCurrency);
  });

  it('should return foreign asset for currency with ID', async () => {
    const currency: TCurrencyCoreV1 = { id: '456' };
    const expectedCurrency = { name: 'Some Currency' } as ForeignAsset;

    const spy = vi
      .spyOn(interBTC.assetRegistry, 'getForeignAsset')
      .mockResolvedValue(expectedCurrency);

    const result = await getCurrency(currency, interBTC, node);

    expect(spy).toHaveBeenCalledWith(456);
    expect(result).toBe(expectedCurrency);
  });
});
