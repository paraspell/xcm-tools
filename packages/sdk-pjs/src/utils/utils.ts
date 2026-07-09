import type { PolkadotApi, TApiOrUrl, TBuilderOptions, TSubstrateChain } from '@paraspell/sdk-core'
import { createChainClient as createChainClientInternal } from '@paraspell/sdk-core'

import PolkadotJsApi from '../PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsSigner } from '../types'

export const createChainClient = (
  chain: TSubstrateChain,
  builderOptions?: TBuilderOptions<TApiOrUrl<TPjsApi>>
) => {
  const pjsApi = new PolkadotJsApi(builderOptions)
  return createChainClientInternal(pjsApi, chain)
}

export const createPolkadotJsApiCall = <TArgs extends Record<string, unknown>, TResult>(
  apiCall: (
    options: TArgs & { api: PolkadotApi<TPjsApi, Extrinsic, TPjsSigner> }
  ) => Promise<TResult>
) => {
  return async (options: TArgs & { api?: TApiOrUrl<TPjsApi> }): Promise<TResult> => {
    const pjsApi = new PolkadotJsApi(options.api)

    const optionsWithApi = {
      ...options,
      api: pjsApi
    } as TArgs & { api: PolkadotApi<TPjsApi, Extrinsic, TPjsSigner> }

    return apiCall(optionsWithApi)
  }
}
