import type { ApiPromise } from '@polkadot/api'
import * as internalUtils from '../utils'
import type { TNodeWithRelayChains } from '../types'
import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic } from './types'
import type { IPolkadotApi } from '../api'

export const createApiInstanceForNode = (node: TNodeWithRelayChains) => {
  const pjsApi = new PolkadotJsApi()
  return internalUtils.createApiInstanceForNode<ApiPromise, Extrinsic>(pjsApi, node)
}

export const createPolkadotJsApiCall = <TArgs extends Record<string, unknown>, TResult>(
  apiCall: (options: TArgs & { api: IPolkadotApi<ApiPromise, Extrinsic> }) => Promise<TResult>
) => {
  return async (options: TArgs & { api?: ApiPromise }): Promise<TResult> => {
    const pjsApi = new PolkadotJsApi()
    pjsApi.setApi(options.api)

    const optionsWithApi = {
      ...options,
      api: pjsApi as IPolkadotApi<ApiPromise, Extrinsic>
    } as TArgs & { api: IPolkadotApi<ApiPromise, Extrinsic> }

    return apiCall(optionsWithApi)
  }
}
