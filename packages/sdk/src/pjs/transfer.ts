import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from './types'
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
  options: Omit<TRelayToParaOptions<TPjsApi, Extrinsic>, 'api' | 'destApiForKeepAlive'> & {
    api: TPjsApiOrUrl
    destApiForKeepAlive: TPjsApiOrUrl
  }
) => {
  const pjsApi = new PolkadotJsApi()
  pjsApi.setApi(options.api)
  const destPjsApi = new PolkadotJsApi()
  destPjsApi.setApi(options.destApiForKeepAlive)
  return transferImpl.transferRelayToPara<TPjsApi, Extrinsic>({
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
  options: Omit<TSendOptions<TPjsApi, Extrinsic>, 'api' | 'destApiForKeepAlive'> & {
    api: TPjsApiOrUrl
    destApiForKeepAlive: TPjsApiOrUrl
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

export * from '../pallets/xcmPallet/ethTransfer'
