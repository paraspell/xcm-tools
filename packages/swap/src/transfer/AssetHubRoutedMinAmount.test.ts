import type { TAssetInfo, TLocation } from '@paraspell/sdk-core';
import {
  BatchMode,
  DryRunFailedError,
  handleSwapExecuteTransfer,
  padValueBy,
} from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExchangeAsset } from '../assets';
import AssetHubExchange from '../exchanges/AssetHub/AssetHubExchange';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../types';
import { buildTransactions } from './buildTransactions';
import { buildFromExchangeExtrinsic } from './utils/utils';

vi.mock('@paraspell/sdk-core', async (importOriginal) => ({
  ...(await importOriginal()),
  getNativeAssetSymbol: vi.fn(() => 'DOT'),
  localizeLocation: vi.fn((_chain: unknown, location: TLocation) => location),
  handleSwapExecuteTransfer: vi.fn(),
}));

vi.mock('../assets', () => ({ getExchangeAsset: vi.fn() }));

vi.mock('./utils/utils', async (importOriginal) => ({
  ...(await importOriginal()),
  buildFromExchangeExtrinsic: vi.fn(),
}));

describe('AssetHub routed swap output', () => {
  beforeEach(() => vi.clearAllMocks());

  it('transfers no more than the swap minimum less the buffered destination fee', async () => {
    const fromLocation: TLocation = { parents: 0, interior: { X1: [{ GeneralIndex: 1 }] } };
    const toLocation: TLocation = { parents: 0, interior: { Here: null } };
    const assetFrom = {
      symbol: 'USDT',
      decimals: 10,
      existentialDeposit: '0',
      location: fromLocation,
    } as TAssetInfo;
    const assetTo = {
      symbol: 'DOT',
      decimals: 10,
      isNative: true,
      existentialDeposit: '0',
      location: toLocation,
    } as TAssetInfo;
    vi.mocked(getExchangeAsset).mockReturnValue(assetTo);

    const swapTx = { kind: 'swap' };
    const batchTx = { kind: 'batch' };
    const exchangeApi = {
      api: {},
      queryRuntimeApi: vi.fn().mockResolvedValue(2000n),
      deserializeExtrinsics: vi.fn().mockReturnValue(swapTx),
      getPaymentInfo: vi.fn().mockResolvedValue({ partialFee: 50n }),
      txToHex: vi.fn().mockResolvedValue('0x1234'),
      txFromHex: vi.fn().mockResolvedValue(swapTx),
      callBatchMethod: vi.fn().mockReturnValue(batchTx),
    };
    vi.mocked(buildFromExchangeExtrinsic).mockImplementation(({ amount }) =>
      Promise.resolve({
        kind: 'transfer',
        amount,
      }),
    );
    vi.mocked(handleSwapExecuteTransfer).mockRejectedValue(
      new DryRunFailedError({
        reason: 'Filtered',
        chainKind: 'origin',
        chain: 'AssetHubPolkadot',
      }),
    );

    const options = {
      api: exchangeApi,
      exchange: {
        apiType: 'GENERIC',
        chain: 'AssetHubPolkadot',
        api: exchangeApi,
        assetFrom,
        assetTo,
      },
      destination: { chain: 'Hydration', address: 'recipient' },
      amount: 1000n,
      sender: 'sender',
      recipient: 'recipient',
      feeCalcAddress: 'sender',
      slippagePct: '5',
    } as unknown as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    const plan = await buildTransactions(new AssetHubExchange('AssetHubPolkadot'), options);
    const swapCall = vi.mocked(exchangeApi.deserializeExtrinsics).mock.calls[0][0] as {
      params: { amount_out_min: bigint };
    };
    const transferCalls = vi.mocked(buildFromExchangeExtrinsic).mock.calls;
    const transferTx = await vi.mocked(buildFromExchangeExtrinsic).mock.results[1].value;

    expect(handleSwapExecuteTransfer).toHaveBeenCalledOnce();
    expect(exchangeApi.getPaymentInfo).toHaveBeenCalledOnce();
    expect(transferCalls).toHaveLength(2); // Dummy fee estimate, then the routed transfer.
    expect(swapCall.params.amount_out_min).toBe(1900n);
    expect(padValueBy(50n, 10)).toBe(55n);
    expect(exchangeApi.callBatchMethod).toHaveBeenCalledWith(
      [swapTx, transferTx],
      BatchMode.BATCH_ALL,
    );
    expect(plan).toHaveLength(1);
    const [plannedTx] = plan;
    if (plannedTx.type !== 'SWAP_AND_TRANSFER') throw new Error('Expected a routed batch');
    expect(transferCalls[1][0].amount).toBe(1845n);
    expect(plannedTx.amountOut).toBe(1845n);
  });
});
