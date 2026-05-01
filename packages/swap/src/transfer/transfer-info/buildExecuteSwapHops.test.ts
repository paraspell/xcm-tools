import type {
  PolkadotApi,
  TAssetInfo,
  TGetXcmFeeResult,
  TSubstrateChain,
} from '@paraspell/sdk-core';
import { buildHopInfo } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildExecuteSwapHops } from './buildExecuteSwapHops';

vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  buildHopInfo: vi.fn(),
}));

const mockApi = {} as PolkadotApi<unknown, unknown, unknown>;

const dotAsset: TAssetInfo = {
  symbol: 'DOT',
  decimals: 10,
  location: { parents: 1, interior: 'Here' },
};

const usdtAsset: TAssetInfo = {
  symbol: 'USDT',
  decimals: 6,
  location: { parents: 0, interior: 'Here' },
};

const buildHop = (
  chain: TSubstrateChain,
  fee: bigint,
  asset: TAssetInfo,
): TGetXcmFeeResult['hops'][number] => ({
  chain,
  result: { fee, asset, feeType: 'paymentInfo' },
});

const currencyFrom = { symbol: 'DOT' };
const currencyTo = { symbol: 'USDT' };

describe('buildExecuteSwapHops', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(buildHopInfo).mockImplementation(({ fee, asset }) =>
      Promise.resolve({
        asset,
        xcmFee: { fee, asset },
      }),
    );
  });

  it('returns empty array when there are no hops', async () => {
    const result = await buildExecuteSwapHops({
      api: mockApi,
      hops: [],
      originChain: 'Acala',
      exchangeChain: 'Hydration',
      currencyFrom,
      currencyTo,
      sender: 'Alice',
    });

    expect(result).toEqual([]);
    expect(buildHopInfo).not.toHaveBeenCalled();
  });

  it('uses currencyFrom for hops before the exchange and currencyTo for hops after', async () => {
    const hops = [
      buildHop('AssetHubPolkadot', 1n, dotAsset),
      buildHop('Hydration', 2n, dotAsset),
      buildHop('AssetHubPolkadot', 3n, usdtAsset),
    ];

    await buildExecuteSwapHops({
      api: mockApi,
      hops,
      originChain: 'Acala',
      exchangeChain: 'Hydration',
      currencyFrom,
      currencyTo,
      sender: 'Alice',
    });

    expect(buildHopInfo).toHaveBeenCalledTimes(3);
    expect(buildHopInfo).toHaveBeenNthCalledWith(1, {
      api: mockApi,
      chain: 'AssetHubPolkadot',
      fee: 1n,
      originChain: 'Acala',
      currency: currencyFrom,
      asset: dotAsset,
      sender: 'Alice',
    });
    expect(buildHopInfo).toHaveBeenNthCalledWith(2, {
      api: mockApi,
      chain: 'Hydration',
      fee: 2n,
      originChain: 'Acala',
      currency: currencyFrom,
      asset: dotAsset,
      sender: 'Alice',
    });
    expect(buildHopInfo).toHaveBeenNthCalledWith(3, {
      api: mockApi,
      chain: 'AssetHubPolkadot',
      fee: 3n,
      originChain: 'Acala',
      currency: currencyTo,
      asset: usdtAsset,
      sender: 'Alice',
    });
  });

  it('marks the exchange hop with isExchange: true', async () => {
    const hops = [
      buildHop('AssetHubPolkadot', 1n, dotAsset),
      buildHop('Hydration', 2n, dotAsset),
      buildHop('Moonbeam', 3n, usdtAsset),
    ];

    const result = await buildExecuteSwapHops({
      api: mockApi,
      hops,
      originChain: 'Acala',
      exchangeChain: 'Hydration',
      currencyFrom,
      currencyTo,
      sender: 'Alice',
    });

    expect(result).toEqual([
      {
        chain: 'AssetHubPolkadot',
        result: { asset: dotAsset, xcmFee: { fee: 1n, asset: dotAsset } },
      },
      {
        chain: 'Hydration',
        result: {
          asset: dotAsset,
          xcmFee: { fee: 2n, asset: dotAsset },
          isExchange: true,
        },
      },
      {
        chain: 'Moonbeam',
        result: { asset: usdtAsset, xcmFee: { fee: 3n, asset: usdtAsset } },
      },
    ]);
  });

  it('treats every hop as pre-swap when the exchange chain is not in the hops list', async () => {
    const hops = [buildHop('AssetHubPolkadot', 1n, dotAsset), buildHop('Moonbeam', 2n, dotAsset)];

    await buildExecuteSwapHops({
      api: mockApi,
      hops,
      originChain: 'Acala',
      exchangeChain: 'Hydration',
      currencyFrom,
      currencyTo,
      sender: 'Alice',
    });

    expect(buildHopInfo).toHaveBeenCalledTimes(2);
    expect(buildHopInfo).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ currency: currencyFrom }),
    );
    expect(buildHopInfo).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ currency: currencyFrom }),
    );
  });

  it('falls back to fee 0n when a hop result has no fee', async () => {
    const hops: TGetXcmFeeResult['hops'] = [
      {
        chain: 'AssetHubPolkadot',
        result: {
          asset: dotAsset,
          feeType: 'paymentInfo',
        } as TGetXcmFeeResult['hops'][number]['result'],
      },
    ];

    await buildExecuteSwapHops({
      api: mockApi,
      hops,
      originChain: 'Acala',
      exchangeChain: 'Hydration',
      currencyFrom,
      currencyTo,
      sender: 'Alice',
    });

    expect(buildHopInfo).toHaveBeenCalledWith(expect.objectContaining({ fee: 0n }));
  });

  it('forwards the sender and originChain to every hop', async () => {
    const hops = [buildHop('AssetHubPolkadot', 1n, dotAsset), buildHop('Hydration', 2n, dotAsset)];

    await buildExecuteSwapHops({
      api: mockApi,
      hops,
      originChain: 'Polkadot',
      exchangeChain: 'Hydration',
      currencyFrom,
      currencyTo,
      sender: '0xEvm',
    });

    expect(buildHopInfo).toHaveBeenCalledTimes(2);
    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({ sender: '0xEvm', originChain: 'Polkadot' }),
    );
  });
});
