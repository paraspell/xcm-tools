import {
  dryRun as dryRunImpl,
  dryRunOrigin as dryRunOriginImpl,
  getBridgeStatus as getBridgeStatusImpl,
  getOriginXcmFee as getOriginXcmFeeImpl,
  getParaEthTransferFees as getEthFeesImpl,
  getXcmFee as getXcmFeeImpl,
  handleSwapExecuteTransfer as handleSwapExecuteTransferImpl,
  send as sendImpl
} from '@paraspell/sdk-core'

import PapiApi from './PapiApi'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'
import { createPapiApiCall } from './utils'

/**
 * Transfers assets from parachain to another parachain or from/to relay chain.
 * @param options - The transfer options.
 * @returns An extrinsic to be signed and sent.
 */
export const send = createPapiApiCall(sendImpl<TPapiApi, TPapiTransaction>)

export const dryRun = createPapiApiCall(dryRunImpl<TPapiApi, TPapiTransaction>)

export const dryRunOrigin = createPapiApiCall(dryRunOriginImpl<TPapiApi, TPapiTransaction>)

export const getParaEthTransferFees = async (ahApi?: TPapiApiOrUrl) => {
  const papiApi = new PapiApi()
  papiApi.setApi(ahApi)
  await papiApi.init('AssetHubPolkadot')
  return getEthFeesImpl<TPapiApi, TPapiTransaction>(papiApi)
}

/**
 * Gets the Ethereum bridge status.
 */
export const getBridgeStatus = async (ahApi?: TPapiApiOrUrl) => {
  const papiApi = new PapiApi()
  papiApi.setApi(ahApi)
  return getBridgeStatusImpl<TPapiApi, TPapiTransaction>(papiApi)
}

export const getOriginXcmFee = createPapiApiCall(getOriginXcmFeeImpl<TPapiApi, TPapiTransaction>)

export const getXcmFee = createPapiApiCall(getXcmFeeImpl<TPapiApi, TPapiTransaction>)

export const handleSwapExecuteTransfer = createPapiApiCall(
  handleSwapExecuteTransferImpl<TPapiApi, TPapiTransaction>
)
