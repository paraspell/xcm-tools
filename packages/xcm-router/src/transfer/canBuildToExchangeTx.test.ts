import type { TAssetInfo, TPapiApi, TPapiTransaction, TParachain } from '@paraspell/sdk';
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
  const mockAssetFromOrigin: TAssetInfo = { assetId: '1', symbol: 'DOT', decimals: 10 };
  const defaultOptions = {
    from: 'Polkadot' as TParachain,
    amount: '10000000000',
  } as TGetBestAmountOutOptions;
  const exchangeChain: TParachain = 'AssetHubPolkadot';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return { success: true } if buildToExchangeExtrinsic is successful', async () => {
    vi.mocked(buildToExchangeExtrinsic).mockResolvedValue(mockTx);

    const result = await canBuildToExchangeTx(
      defaultOptions,
      exchangeChain,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).toHaveBeenCalledOnce();
    expect(buildToExchangeExtrinsic).toHaveBeenCalledWith({
      amount: BigInt(defaultOptions.amount),
      senderAddress: 'fallback_address',
      evmSenderAddress: 'fallback_evm_address',
      origin: {
        api: mockOriginApi,
        chain: defaultOptions.from,
        assetFrom: mockAssetFromOrigin,
      },
      exchange: { baseChain: exchangeChain },
    });
  });

  it('should return { success: true } if "from" is undefined, without calling buildToExchangeExtrinsic', async () => {
    const options = { ...defaultOptions, from: undefined as unknown as TParachain };
    const result = await canBuildToExchangeTx(
      options,
      exchangeChain,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).not.toHaveBeenCalled();
  });

  it('should return { success: true } if "from" is the same as "exchangeChain", without calling buildToExchangeExtrinsic', async () => {
    const options = { ...defaultOptions, from: exchangeChain };
    const result = await canBuildToExchangeTx(
      options,
      exchangeChain,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).not.toHaveBeenCalled();
  });

  it('should return { success: true } if "originApi" is undefined, without calling buildToExchangeExtrinsic', async () => {
    const result = await canBuildToExchangeTx(
      defaultOptions,
      exchangeChain,
      undefined,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).not.toHaveBeenCalled();
  });

  it('should return { success: true } if "assetFromOrigin" is null, without calling buildToExchangeExtrinsic', async () => {
    const result = await canBuildToExchangeTx(defaultOptions, exchangeChain, mockOriginApi, null);

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).not.toHaveBeenCalled();
  });

  it('should return { success: true } if "assetFromOrigin" is undefined, without calling buildToExchangeExtrinsic', async () => {
    const result = await canBuildToExchangeTx(
      defaultOptions,
      exchangeChain,
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
      exchangeChain,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: false, error });
    expect(buildToExchangeExtrinsic).toHaveBeenCalledOnce();
  });

  it('should return { success: false, error } if buildToExchangeExtrinsic throws ScenarioNotSupportedError', async () => {
    const error = new ScenarioNotSupportedError({ chain: 'Acala', scenario: 'ParaToPara' });
    vi.mocked(buildToExchangeExtrinsic).mockRejectedValue(error);

    const result = await canBuildToExchangeTx(
      defaultOptions,
      exchangeChain,
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
      exchangeChain,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).toHaveBeenCalledOnce();
  });

  it('should handle TGetBestAmountOutOptions type for options input', async () => {
    vi.mocked(buildToExchangeExtrinsic).mockResolvedValue(mockTx);
    const getBestAmountOutOptions = {
      from: 'Moonbeam' as TParachain,
      amount: '5000000000000000000',
      currencyFrom: { symbol: 'GLMR' },
      currencyTo: { symbol: 'DOT' },
      to: 'Polkadot' as TParachain,
    } as TGetBestAmountOutOptions;

    const result = await canBuildToExchangeTx(
      getBestAmountOutOptions,
      exchangeChain,
      mockOriginApi,
      mockAssetFromOrigin,
    );

    expect(result).toEqual({ success: true });
    expect(buildToExchangeExtrinsic).toHaveBeenCalledOnce();
    expect(buildToExchangeExtrinsic).toHaveBeenCalledWith({
      amount: BigInt(getBestAmountOutOptions.amount),
      senderAddress: 'fallback_address',
      evmSenderAddress: 'fallback_evm_address',
      origin: {
        api: mockOriginApi,
        chain: getBestAmountOutOptions.from,
        assetFrom: mockAssetFromOrigin,
      },
      exchange: { baseChain: exchangeChain },
    });
  });
});
