import type { IPolkadotApi, TSubstrateChain } from '@paraspell/sdk-core'
import { createChainClient as createChainClientInternal } from '@paraspell/sdk-core'

import PapiApi from './PapiApi'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'

export const createChainClient = (chain: TSubstrateChain) => {
  const papiApi = new PapiApi()
  return createChainClientInternal<TPapiApi, TPapiTransaction>(papiApi, chain)
}

export const createPapiApiCall = <TArgs extends Record<string, unknown>, TResult>(
  apiCall: (options: TArgs & { api: IPolkadotApi<TPapiApi, TPapiTransaction> }) => Promise<TResult>
) => {
  return async (options: TArgs & { api?: TPapiApiOrUrl }): Promise<TResult> => {
    const papiApi = new PapiApi(options.api)

    const optionsWithApi = {
      ...options,
      api: papiApi as IPolkadotApi<TPapiApi, TPapiTransaction>
    } as TArgs & { api: IPolkadotApi<TPapiApi, TPapiTransaction> }

    return apiCall(optionsWithApi)
  }
}
