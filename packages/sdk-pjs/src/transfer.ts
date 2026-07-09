import type { TApiOrUrl } from '@paraspell/sdk-core'
import {
  dryRun as dryRunImpl,
  dryRunOrigin as dryRunOriginImpl,
  getBridgeStatus as getBridgeStatusImpl,
  getParaEthTransferFees as getEthFeesImpl
} from '@paraspell/sdk-core'
import { DRY_RUN_CLIENT_TIMEOUT_MS } from '@paraspell/sdk-core'

import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsSigner } from './types'
import { createPolkadotJsApiCall } from './utils'

export const dryRun = createPolkadotJsApiCall(dryRunImpl<TPjsApi, Extrinsic, TPjsSigner>)

export const dryRunOrigin = createPolkadotJsApiCall(
  dryRunOriginImpl<TPjsApi, Extrinsic, TPjsSigner>
)

export const getParaEthTransferFees = async (api?: TApiOrUrl<TPjsApi>) => {
  const pjsApi = new PolkadotJsApi(api)
  await pjsApi.init('AssetHubPolkadot', DRY_RUN_CLIENT_TIMEOUT_MS)
  return getEthFeesImpl(pjsApi)
}

/**
 * Gets the Ethereum bridge status.
 */
export const getBridgeStatus = async (api?: TApiOrUrl<TPjsApi>) => {
  const pjsApi = new PolkadotJsApi(api)
  return getBridgeStatusImpl(pjsApi)
}
