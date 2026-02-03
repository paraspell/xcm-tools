import type {
  TBuilderOptions,
  TCreateBaseSwapXcmOptions,
  TGetXcmFeeBaseOptions
} from '@paraspell/sdk-core'
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
import type { TPapiApi, TPapiApiOrUrl, TPapiSigner, TPapiTransaction } from './types'
import { createPapiApiCall } from './utils'

/**
 * Transfers assets from parachain to another parachain or from/to relay chain.
 * @param options - The transfer options.
 * @returns An extrinsic to be signed and sent.
 */
export const send = createPapiApiCall(sendImpl<TPapiApi, TPapiTransaction, TPapiSigner>)

export const dryRun = createPapiApiCall(dryRunImpl<TPapiApi, TPapiTransaction, TPapiSigner>)

export const dryRunOrigin = createPapiApiCall(
  dryRunOriginImpl<TPapiApi, TPapiTransaction, TPapiSigner>
)

export const getParaEthTransferFees = async (ahApi?: TPapiApiOrUrl) => {
  const papiApi = new PapiApi(ahApi)
  await papiApi.init('AssetHubPolkadot')
  return getEthFeesImpl<TPapiApi, TPapiTransaction, TPapiSigner>(papiApi)
}

/**
 * Gets the Ethereum bridge status.
 */
export const getBridgeStatus = async (ahApi?: TPapiApiOrUrl) => {
  const papiApi = new PapiApi(ahApi)
  return getBridgeStatusImpl<TPapiApi, TPapiTransaction, TPapiSigner>(papiApi)
}

export const getOriginXcmFee = createPapiApiCall(
  getOriginXcmFeeImpl<TPapiApi, TPapiTransaction, TPapiSigner>
)

export const getXcmFee = async <TDisableFallback extends boolean>(
  options: TGetXcmFeeBaseOptions<TPapiTransaction, TDisableFallback>,
  builderOptions?: TBuilderOptions<TPapiApiOrUrl>
) => {
  const api = new PapiApi(builderOptions)
  return getXcmFeeImpl({
    ...options,
    api
  })
}

export const handleSwapExecuteTransfer = (
  options: TCreateBaseSwapXcmOptions,
  builderOptions?: TBuilderOptions<TPapiApiOrUrl>
) => {
  const api = new PapiApi(builderOptions)
  return handleSwapExecuteTransferImpl<TPapiApi, TPapiTransaction, TPapiSigner>({
    ...options,
    api
  })
}
