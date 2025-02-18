import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from './types'
import type { TEvmBuilderOptions } from '@paraspell/sdk-core'
import {
  send as sendImpl,
  getDryRun as getDryRunImpl,
  getParaEthTransferFees as getEthFeesImpl
} from '@paraspell/sdk-core'
import { transferEthToPolkadot as transferEthToPolkadotImpl } from './ethTransfer'
import PolkadotJsApi from './PolkadotJsApi'
import { createPolkadotJsApiCall } from './utils'

/**
 * Transfers assets from parachain to another parachain or from/to relay chain.
 * @param options - The transfer options.
 * @returns An extrinsic to be signed and sent.
 */
export const send = createPolkadotJsApiCall(sendImpl<TPjsApi, Extrinsic>)

export const getDryRun = createPolkadotJsApiCall(getDryRunImpl<TPjsApi, Extrinsic>)

export const transferEthToPolkadot = (
  options: Omit<TEvmBuilderOptions<TPjsApi, Extrinsic>, 'api'>
) =>
  transferEthToPolkadotImpl({
    ...options,
    api: new PolkadotJsApi()
  })

export const getParaEthTransferFees = async (api?: TPjsApiOrUrl) => {
  const pjsApi = new PolkadotJsApi()
  pjsApi.setApi(api)
  await pjsApi.init('AssetHubPolkadot')
  return getEthFeesImpl<TPjsApi, Extrinsic>(pjsApi)
}

export { depositToken, approveToken, getTokenBalance } from './ethTransfer'
