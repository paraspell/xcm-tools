import {
  send as sendImpl,
  getDryRun as getDryRunImpl,
  getParaEthTransferFees as getEthFeesImpl
} from '@paraspell/sdk-core'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'
import { createPapiApiCall } from './utils'
import PapiApi from './PapiApi'

/**
 * Transfers assets from parachain to another parachain or from/to relay chain.
 * @param options - The transfer options.
 * @returns An extrinsic to be signed and sent.
 */
export const send = createPapiApiCall(sendImpl<TPapiApi, TPapiTransaction>)

export const getDryRun = createPapiApiCall(getDryRunImpl<TPapiApi, TPapiTransaction>)

export const getParaEthTransferFees = async (ahApi?: TPapiApiOrUrl) => {
  const papiApi = new PapiApi()
  papiApi.setApi(ahApi)
  await papiApi.init('AssetHubPolkadot')
  return getEthFeesImpl<TPapiApi, TPapiTransaction>(papiApi)
}
