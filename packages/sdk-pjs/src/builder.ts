import type { AbstractProvider } from 'ethers'
import { Builder as BuilderImpl } from '@paraspell/sdk-core'
import { EvmBuilder as EvmBuilderImpl } from './evm-builder/EvmBuilder'
import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from './types'

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
export const Builder = (api?: TPjsApiOrUrl) => {
  const pjsApi = new PolkadotJsApi()
  pjsApi.setApi(api)
  return BuilderImpl<TPjsApi, Extrinsic>(pjsApi)
}

export const EvmBuilder = (provider?: AbstractProvider) => {
  const pjsApi = new PolkadotJsApi()
  return EvmBuilderImpl<TPjsApi, Extrinsic>(pjsApi, provider)
}
