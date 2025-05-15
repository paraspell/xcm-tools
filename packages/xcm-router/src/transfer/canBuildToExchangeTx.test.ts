import type { TAsset, TNodePolkadotKusama, TPapiApi, TPapiTransaction } from '@paraspell/sdk';
import { ScenarioNotSupportedError, TransferToAhNotSupported } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TGetBestAmountOutOptions } from '../types';
import { canBuildToExchangeTx } from './canBuildToExchangeTx';
import { buildToExchangeExtrinsic } from './utils';

vi.mock('./utils', () => ({
  buildToExchangeExtrinsic: vi.fn(),
}));

vi.mock('../consts', () => ({
  FALLBACK_FEE_CALC_ADDRESS: 'fallback_address',
  FALLBACK_FEE_CALC_EVM_ADDRESS: 'fallback_evm_address',
}));

describe('canBuildToExchangeTx', () => {
  const mockOriginApi = {} as TPapiApi;
  const mockTx = 'mocked_tx' as unknown as TPapiTransaction;
  const mockAssetFromOrigin: TAsset = { assetId: '1', symbol: 'DOT', decimals: 10 };
  const defaultOptions = {
    from: 'Polkadot' as TNodePolkadotKusama,
    amount: '10000000000',
  } as TGetBestAmountOutOptions;
  const exchangeNode: TNodePolkadotKusama = 'AssetHubPolkadot';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return { success: true } if buildToExchangeExtrinsic is successful', async () => {
    vi.mocked(buildToExchangeExtrinsic).mockResolvedValue(mockTx);

    const result = await canBuildToExchangeTx(
      defaultOptions,
      exchangeNode,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).toHaveBeenCalledOnce();
    expect(buildToExchangeExtrinsic).toHaveBeenCalledWith({
      amount: defaultOptions.amount,
      senderAddress: 'fallback_address',
      evmSenderAddress: 'fallback_evm_address',
      origin: {
        api: mockOriginApi,
        node: defaultOptions.from,
        assetFrom: mockAssetFromOrigin,
      },
      exchange: { baseNode: exchangeNode },
    });
  });

  it('should return { success: true } if "from" is undefined, without calling buildToExchangeExtrinsic', async () => {
    const options = { ...defaultOptions, from: undefined as unknown as TNodePolkadotKusama };
    const result = await canBuildToExchangeTx(
      options,
      exchangeNode,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).not.toHaveBeenCalled();
  });

  it('should return { success: true } if "from" is the same as "exchangeNode", without calling buildToExchangeExtrinsic', async () => {
    const options = { ...defaultOptions, from: exchangeNode };
    const result = await canBuildToExchangeTx(
      options,
      exchangeNode,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).not.toHaveBeenCalled();
  });

  it('should return { success: true } if "originApi" is undefined, without calling buildToExchangeExtrinsic', async () => {
    const result = await canBuildToExchangeTx(
      defaultOptions,
      exchangeNode,
      undefined,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).not.toHaveBeenCalled();
  });

  it('should return { success: true } if "assetFromOrigin" is null, without calling buildToExchangeExtrinsic', async () => {
    const result = await canBuildToExchangeTx(defaultOptions, exchangeNode, mockOriginApi, null);

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).not.toHaveBeenCalled();
  });

  it('should return { success: true } if "assetFromOrigin" is undefined, without calling buildToExchangeExtrinsic', async () => {
    const result = await canBuildToExchangeTx(
      defaultOptions,
      exchangeNode,
      mockOriginApi,
      undefined,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).not.toHaveBeenCalled();
  });

  it('should return { success: false, error } if buildToExchangeExtrinsic throws TransferToAhNotSupported', async () => {
    const error = new TransferToAhNotSupported('Test AH error');
    vi.mocked(buildToExchangeExtrinsic).mockRejectedValue(error);

    const result = await canBuildToExchangeTx(
      defaultOptions,
      exchangeNode,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: false, error });
    expect(buildToExchangeExtrinsic).toHaveBeenCalledOnce();
  });

  it('should return { success: false, error } if buildToExchangeExtrinsic throws ScenarioNotSupportedError', async () => {
    const error = new ScenarioNotSupportedError('Acala', 'ParaToPara', 'Test scenario error');
    vi.mocked(buildToExchangeExtrinsic).mockRejectedValue(error);

    const result = await canBuildToExchangeTx(
      defaultOptions,
      exchangeNode,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: false, error });
    expect(buildToExchangeExtrinsic).toHaveBeenCalledOnce();
  });

  it('should return { success: true } if buildToExchangeExtrinsic throws an unknown error', async () => {
    const unknownError = new Error('Some unknown error');
    vi.mocked(buildToExchangeExtrinsic).mockRejectedValue(unknownError);

    const result = await canBuildToExchangeTx(
      defaultOptions,
      exchangeNode,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).toHaveBeenCalledOnce();
  });

  it('should handle TGetBestAmountOutOptions type for options input', async () => {
    vi.mocked(buildToExchangeExtrinsic).mockResolvedValue(mockTx);
    const getBestAmountOutOptions = {
      from: 'Moonbeam' as TNodePolkadotKusama,
      amount: '5000000000000000000',
      currencyFrom: { symbol: 'GLMR' },
      currencyTo: { symbol: 'DOT' },
      to: 'Polkadot' as TNodePolkadotKusama,
    } as TGetBestAmountOutOptions;

    const result = await canBuildToExchangeTx(
      getBestAmountOutOptions,
      exchangeNode,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).toHaveBeenCalledOnce();
    expect(buildToExchangeExtrinsic).toHaveBeenCalledWith({
      amount: getBestAmountOutOptions.amount,
      senderAddress: 'fallback_address',
      evmSenderAddress: 'fallback_evm_address',
      origin: {
        api: mockOriginApi,
        node: getBestAmountOutOptions.from,
        assetFrom: mockAssetFromOrigin,
      },
      exchange: { baseNode: exchangeNode },
    });
  });
});
