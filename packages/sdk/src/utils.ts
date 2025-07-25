import type { IPolkadotApi, TNodeDotKsmWithRelayChains } from '@paraspell/sdk-core'
import { createApiInstanceForNode as createApiInstanceForNodeInternal } from '@paraspell/sdk-core'

import PapiApi from './PapiApi'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'

export const createApiInstanceForNode = (node: TNodeDotKsmWithRelayChains) => {
  const papiApi = new PapiApi()
  return createApiInstanceForNodeInternal<TPapiApi, TPapiTransaction>(papiApi, node)
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
