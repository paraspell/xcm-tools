import type { TSendOptions } from '@paraspell/sdk-core'
import { send as sendImpl, getDryRun as getDryRunImpl } from '@paraspell/sdk-core'
import PapiApi from './PapiApi'
import type { TPapiApiOrUrl, TPapiApi, TPapiTransaction } from './types'
import { createPapiApiCall } from './utils'

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
  return sendImpl({
    ...options,
    api: papiApi,
    destApiForKeepAlive: destPapiApi
  })
}

export const getDryRun = createPapiApiCall(getDryRunImpl<TPapiApi, TPapiTransaction>)
