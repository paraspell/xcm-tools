import { send as sendImpl, getDryRun as getDryRunImpl } from '@paraspell/sdk-core'
import type { TPapiApi, TPapiTransaction } from './types'
import { createPapiApiCall } from './utils'

/**
 * Transfers assets from parachain to another parachain or from/to relay chain.
 * @param options - The transfer options.
 * @returns An extrinsic to be signed and sent.
 */
export const send = createPapiApiCall(sendImpl<TPapiApi, TPapiTransaction>)

export const getDryRun = createPapiApiCall(getDryRunImpl<TPapiApi, TPapiTransaction>)
