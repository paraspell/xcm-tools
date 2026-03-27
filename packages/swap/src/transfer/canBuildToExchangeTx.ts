import type { TAssetInfo, TParachain } from '@paraspell/sdk-core';
import { ScenarioNotSupportedError, TransferToAhNotSupported } from '@paraspell/sdk-core';

import { FALLBACK_FEE_CALC_ADDRESS, FALLBACK_FEE_CALC_EVM_ADDRESS } from '../consts';
import type { TBuildTransactionsOptions, TExchangeInfo } from '../types';
import { buildToExchangeExtrinsic } from './utils';

export const canBuildToExchangeTx = async <TApi, TRes, TSigner>(
  options: Pick<TBuildTransactionsOptions<TApi, TRes, TSigner>, 'api' | 'from' | 'amount'>,
  exchangeChain: TParachain,
  originApi: TApi | undefined,
  assetFromOrigin: TAssetInfo | null | undefined,
): Promise<{ success: true } | { success: false; error: Error }> => {
  // Try building the to exchange extrinsic to see if it will succeed for this exchange

  const { from, amount, api } = options;

  try {
    const _toExchangeTx =
      from && from !== exchangeChain && originApi && assetFromOrigin
        ? await buildToExchangeExtrinsic({
            amount: BigInt(amount),
            sender: FALLBACK_FEE_CALC_ADDRESS,
            evmSenderAddress: FALLBACK_FEE_CALC_EVM_ADDRESS,
            origin: {
              api: originApi,
              chain: from,
              assetFrom: assetFromOrigin,
            },
            exchange: { baseChain: exchangeChain } as TExchangeInfo<TApi, TRes, TSigner>,
            api,
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
