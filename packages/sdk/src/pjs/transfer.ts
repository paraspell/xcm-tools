import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from './types'
import * as transferImpl from '../pallets/xcmPallet/transfer'
import type { TSendOptions } from '../types'
import PolkadotJsApi from './PolkadotJsApi'
import { createPolkadotJsApiCall } from './utils'

/**
 * Transfers assets from parachain to another parachain or from/to relay chain.
 * @param options - The transfer options.
 * @returns An extrinsic to be signed and sent.
 */
export const send = (
  options: Omit<TSendOptions<TPjsApi, Extrinsic>, 'api' | 'destApiForKeepAlive'> & {
    api?: TPjsApiOrUrl
    destApiForKeepAlive?: TPjsApiOrUrl
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

export const getDryRun = createPolkadotJsApiCall(transferImpl.getDryRun<TPjsApi, Extrinsic>)

export * from '../pallets/xcmPallet/ethTransfer'
