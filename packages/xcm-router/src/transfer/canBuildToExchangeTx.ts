import type { TAssetInfo, TNodePolkadotKusama, TPapiApi } from '@paraspell/sdk';
import { ScenarioNotSupportedError, TransferToAhNotSupported } from '@paraspell/sdk';

import { FALLBACK_FEE_CALC_ADDRESS, FALLBACK_FEE_CALC_EVM_ADDRESS } from '../consts';
import type { TCommonTransferOptions, TExchangeInfo, TGetBestAmountOutOptions } from '../types';
import { buildToExchangeExtrinsic } from './utils';

export const canBuildToExchangeTx = async (
  options: TCommonTransferOptions | TGetBestAmountOutOptions,
  exchangeNode: TNodePolkadotKusama,
  originApi: TPapiApi | undefined,
  assetFromOrigin: TAssetInfo | null | undefined,
): Promise<{ success: true } | { success: false; error: Error }> => {
  // Try building the to exchange extrinsic to see if it will succeed for this exchange

  const { from, amount } = options;

  try {
    const _toExchangeTx =
      from && from !== exchangeNode && originApi && assetFromOrigin
        ? await buildToExchangeExtrinsic({
            amount,
            senderAddress: FALLBACK_FEE_CALC_ADDRESS,
            evmSenderAddress: FALLBACK_FEE_CALC_EVM_ADDRESS,
            origin: {
              api: originApi,
              node: from,
              assetFrom: assetFromOrigin,
            },
            exchange: { baseNode: exchangeNode } as TExchangeInfo,
          })
        : undefined;
  } catch (e) {
    if (e instanceof TransferToAhNotSupported || e instanceof ScenarioNotSupportedError) {
      return {
        success: false,
        error: e,
      };
    }
  }
  return {
    success: true,
  };
};
