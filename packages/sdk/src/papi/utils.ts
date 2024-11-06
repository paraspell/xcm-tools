import * as internalUtils from '../utils'
import type { TNodeWithRelayChains } from '../types'
import PapiApi from './PapiApi'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'
import type { IPolkadotApi } from '../api'

export const createApiInstanceForNode = (node: TNodeWithRelayChains) => {
  const pjsApi = new PapiApi()
  return internalUtils.createApiInstanceForNode<TPapiApi, TPapiTransaction>(pjsApi, node)
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

export * from '../utils/assets/isForeignAsset'
