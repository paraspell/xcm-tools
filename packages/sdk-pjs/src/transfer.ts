import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from './types'
import type { TEvmBuilderOptions, TSendOptions } from '@paraspell/sdk-core'
import { send as sendImpl, getDryRun as getDryRunImpl } from '@paraspell/sdk-core'
import { transferEthToPolkadot as transferEthToPolkadotImpl } from './ethTransfer'
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
  return sendImpl({
    ...options,
    api: pjsApi,
    destApiForKeepAlive: destPjsApi
  })
}

export const getDryRun = createPolkadotJsApiCall(getDryRunImpl<TPjsApi, Extrinsic>)

export const transferEthToPolkadot = (
  options: Omit<TEvmBuilderOptions<TPjsApi, Extrinsic>, 'api'>
) =>
  transferEthToPolkadotImpl({
    ...options,
    api: new PolkadotJsApi()
  })

export * from './ethTransfer/buildEthTransferOptions'
