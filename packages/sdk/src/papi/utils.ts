import * as internalUtils from '../utils'
import type { TNodeWithRelayChains } from '../types'
import PapiApi from './PapiApi'
import type { PolkadotClient } from 'polkadot-api'
import type { TPapiTransaction } from './types'
import type { IPolkadotApi } from '../api'

export const createApiInstanceForNode = (node: TNodeWithRelayChains) => {
  const pjsApi = new PapiApi()
  return internalUtils.createApiInstanceForNode<PolkadotClient, TPapiTransaction>(pjsApi, node)
}

export const createPapiApiCall = <TArgs extends Record<string, unknown>, TResult>(
  apiCall: (
    options: TArgs & { api: IPolkadotApi<PolkadotClient, TPapiTransaction> }
  ) => Promise<TResult>
) => {
  return async (options: TArgs & { api?: PolkadotClient }): Promise<TResult> => {
    const pjsApi = new PapiApi()
    pjsApi.setApi(options.api)

    const optionsWithApi = {
      ...options,
      api: pjsApi as IPolkadotApi<PolkadotClient, TPapiTransaction>
    } as TArgs & { api: IPolkadotApi<PolkadotClient, TPapiTransaction> }

    return apiCall(optionsWithApi)
  }
}
