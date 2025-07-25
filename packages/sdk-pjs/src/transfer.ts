import {
  dryRun as dryRunImpl,
  dryRunOrigin as dryRunOriginImpl,
  getBridgeStatus as getBridgeStatusImpl,
  getParaEthTransferFees as getEthFeesImpl,
  send as sendImpl
} from '@paraspell/sdk-core'
import { DRY_RUN_CLIENT_TIMEOUT_MS } from '@paraspell/sdk-core'

import { transferEthToPolkadot as transferEthToPolkadotImpl } from './ethTransfer'
import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl, TPjsEvmBuilderOptions } from './types'
import { createPolkadotJsApiCall } from './utils'

/**
 * Transfers assets from parachain to another parachain or from/to relay chain.
 * @param options - The transfer options.
 * @returns An extrinsic to be signed and sent.
 */
export const send = createPolkadotJsApiCall(sendImpl<TPjsApi, Extrinsic>)

export const dryRun = createPolkadotJsApiCall(dryRunImpl<TPjsApi, Extrinsic>)

export const dryRunOrigin = createPolkadotJsApiCall(dryRunOriginImpl<TPjsApi, Extrinsic>)

export const transferEthToPolkadot = (
  options: Omit<TPjsEvmBuilderOptions<TPjsApi, Extrinsic>, 'api'>
) =>
  transferEthToPolkadotImpl({
    ...options,
    api: new PolkadotJsApi()
  })

export const getParaEthTransferFees = async (api?: TPjsApiOrUrl) => {
  const pjsApi = new PolkadotJsApi(api)
  await pjsApi.init('AssetHubPolkadot', DRY_RUN_CLIENT_TIMEOUT_MS)
  return getEthFeesImpl(pjsApi)
}

/**
 * Gets the Ethereum bridge status.
 */
export const getBridgeStatus = async (api?: TPjsApiOrUrl) => {
  const pjsApi = new PolkadotJsApi(api)
  return getBridgeStatusImpl(pjsApi)
}

export { approveToken, depositToken, getTokenBalance } from './ethTransfer'
