import type { PolkadotApi, TAssetInfo, TXcmFeeDetail } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TDestinationInfo, TTransformedOptions } from '../../types';
import { getFromExchangeFee } from '../utils';
import { getExchangeOriginFee } from './getExchangeOriginFee';
import { getSwapFee } from './getSwapFee';

vi.mock('./getSwapFee');
vi.mock('../utils');

const mockApi = {} as PolkadotApi<unknown, unknown, unknown>;

describe('getExchangeOriginFee', () => {
  const dex = { chain: 'Hydration' } as unknown as ExchangeChain;

  const swapFee: TXcmFeeDetail = {
    fee: 100n,
    feeType: 'dryRun',
    asset: { symbol: 'HDX' } as TAssetInfo,
  };

  let options: TTransformedOptions<
    TBuildTransactionsOptions<unknown, unknown, unknown>,
    unknown,
    unknown,
    unknown
  >;

  beforeEach(() => {
    vi.clearAllMocks();

    options = {
      exchange: {
        chain: 'Hydration',
        api: mockApi,
        assetFrom: { symbol: 'HDX' } as TAssetInfo,
        assetTo: { symbol: 'USDT' } as TAssetInfo,
      },
      sender: 'sender',
      amount: 1000n,
      api: mockApi,
    } as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    vi.mocked(getSwapFee).mockResolvedValue({ result: swapFee, amountOut: 500n });
    vi.mocked(getFromExchangeFee).mockResolvedValue({
      origin: { fee: 20n, asset: { symbol: 'HDX' } },
      destination: { fee: 5n, asset: { symbol: 'USDT' } },
      hops: [],
    } as never);
  });

  it('returns only the swap fee when there is no destination', async () => {
    const result = await getExchangeOriginFee(dex, options);

    expect(getSwapFee).toHaveBeenCalledWith(dex, options, undefined);
    expect(getFromExchangeFee).not.toHaveBeenCalled();
    expect(result).toEqual(swapFee);
  });

  it('returns only the swap fee when destination is the exchange chain', async () => {
    options.destination = { chain: 'Hydration' } as TDestinationInfo;

    const result = await getExchangeOriginFee(dex, options);

    expect(getFromExchangeFee).not.toHaveBeenCalled();
    expect(result).toEqual(swapFee);
  });

  it('adds the exchange -> destination origin fee when destination differs', async () => {
    options.destination = { chain: 'Darwinia', address: 'recipient' };

    const result = await getExchangeOriginFee(dex, options);

    expect(getFromExchangeFee).toHaveBeenCalledWith(
      {
        exchange: options.exchange,
        destination: options.destination,
        amount: 500n,
        sender: 'sender',
        api: mockApi,
      },
      false,
    );
    expect(result).toEqual({ ...swapFee, fee: 120n });
  });

  it('forwards disableFallback to both fee calls', async () => {
    options.destination = { chain: 'Darwinia', address: 'recipient' };

    await getExchangeOriginFee(dex, options, true);

    expect(getSwapFee).toHaveBeenCalledWith(dex, options, true);
    expect(getFromExchangeFee).toHaveBeenCalledWith(expect.any(Object), true);
  });
});
