import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from './types'
import * as transferImpl from '../pallets/xcmPallet/transfer'
import type { TRelayToParaOptions, TSendOptions } from '../types'
import PolkadotJsApi from './PolkadotJsApi'

/**
 * Transfers assets from relay chain to parachain.
 *
 * @param options - The transfer options.
 *
 * @returns An extrinsic to be signed and sent.
 */
export const transferRelayToPara = (
  options: Omit<TRelayToParaOptions<ApiPromise, Extrinsic>, 'api' | 'destApiForKeepAlive'> & {
    api: ApiPromise
    destApiForKeepAlive: ApiPromise
  }
) => {
  const pjsApi = new PolkadotJsApi()
  pjsApi.setApi(options.api)
  const destPjsApi = new PolkadotJsApi()
  destPjsApi.setApi(options.destApiForKeepAlive)
  return transferImpl.transferRelayToPara<ApiPromise, Extrinsic>({
    ...options,
    api: pjsApi,
    destApiForKeepAlive: destPjsApi
  })
}

export const transferRelayToParaSerializedApiCall = (
  options: Omit<TRelayToParaOptions<ApiPromise, Extrinsic>, 'api' | 'destApiForKeepAlive'> & {
    api: ApiPromise
    destApiForKeepAlive: ApiPromise
  }
) => {
  const pjsApi = new PolkadotJsApi()
  pjsApi.setApi(options.api)
  const destPjsApi = new PolkadotJsApi()
  destPjsApi.setApi(options.destApiForKeepAlive)
  return transferImpl.transferRelayToParaSerializedApiCall<ApiPromise, Extrinsic>({
    ...options,
    api: pjsApi,
    destApiForKeepAlive: destPjsApi
  })
}

/**
 * Transfers assets from parachain to another parachain or relay chain.
 * @param options - The transfer options.
 * @returns An extrinsic to be signed and sent.
 */
export const send = (
  options: Omit<TSendOptions<ApiPromise, Extrinsic>, 'api' | 'destApiForKeepAlive'> & {
    api: ApiPromise
    destApiForKeepAlive: ApiPromise
  }
) => {
  const pjsApi = new PolkadotJsApi()
  pjsApi.setApi(options.api)
  const destPjsApi = new PolkadotJsApi()
  destPjsApi.setApi(options.destApiForKeepAlive)
  return transferImpl.send({
    ...options,
    api: pjsApi,
    destApiForKeepAlive: destPjsApi
  })
}

export const sendSerializedApiCall = (
  options: Omit<TSendOptions<ApiPromise, Extrinsic>, 'api' | 'destApiForKeepAlive'> & {
    api: ApiPromise
    destApiForKeepAlive: ApiPromise
  }
) => {
  const pjsApi = new PolkadotJsApi()
  pjsApi.setApi(options.api)
  const destPjsApi = new PolkadotJsApi()
  destPjsApi.setApi(options.destApiForKeepAlive)
  return transferImpl.sendSerializedApiCall({
    ...options,
    api: pjsApi,
    destApiForKeepAlive: destPjsApi
  })
}

export * from '../pallets/xcmPallet/ethTransfer'
