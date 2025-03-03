import type { IPolkadotApi, TNodeDotKsmWithRelayChains } from '@paraspell/sdk-core'
import { createApiInstanceForNode as createApiInstanceForNodeInternal } from '@paraspell/sdk-core'
import PapiApi from './PapiApi'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'

export const createApiInstanceForNode = (node: TNodeDotKsmWithRelayChains) => {
  const pjsApi = new PapiApi()
  return createApiInstanceForNodeInternal<TPapiApi, TPapiTransaction>(pjsApi, node)
}

export const createPapiApiCall = <TArgs extends Record<string, unknown>, TResult>(
  apiCall: (options: TArgs & { api: IPolkadotApi<TPapiApi, TPapiTransaction> }) => Promise<TResult>
) => {
  return async (options: TArgs & { api?: TPapiApiOrUrl }): Promise<TResult> => {
    const pjsApi = new PapiApi()
    pjsApi.setApi(options.api)

    const optionsWithApi = {
      ...options,
      api: pjsApi as IPolkadotApi<TPapiApi, TPapiTransaction>
    } as TArgs & { api: IPolkadotApi<TPapiApi, TPapiTransaction> }

    return apiCall(optionsWithApi)
  }
}
