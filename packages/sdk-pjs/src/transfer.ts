import type { Extrinsic, TPjsApi } from './types'
import type { TEvmBuilderOptions } from '@paraspell/sdk-core'
import { send as sendImpl, getDryRun as getDryRunImpl } from '@paraspell/sdk-core'
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

export * from './ethTransfer/buildEthTransferOptions'
