import * as transferImpl from '../pallets/xcmPallet/transfer'
import type { TSendOptions } from '../types'
import PapiApi from './PapiApi'
import type { TPapiApiOrUrl, TPapiApi, TPapiTransaction } from './types'

/**
 * Transfers assets from parachain to another parachain or from/to relay chain.
 * @param options - The transfer options.
 * @returns An extrinsic to be signed and sent.
 */
export const send = (
  options: Omit<TSendOptions<TPapiApi, TPapiTransaction>, 'api' | 'destApiForKeepAlive'> & {
    api: TPapiApiOrUrl
    destApiForKeepAlive: TPapiApiOrUrl
  }
) => {
  const papiApi = new PapiApi()
  papiApi.setApi(options.api)
  const destPapiApi = new PapiApi()
  destPapiApi.setApi(options.destApiForKeepAlive)
  return transferImpl.send({
    ...options,
    api: papiApi,
    destApiForKeepAlive: destPapiApi
  })
}

export * from '../pallets/xcmPallet/ethTransfer'
