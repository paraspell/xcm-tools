import type { AbstractProvider } from 'ethers'
import * as InternalBuilder from '../builder'
import * as InternalEvmBuilder from '../builder/evm-builder/EvmBuilder'
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
  return InternalBuilder.Builder<TPjsApi, Extrinsic>(pjsApi)
}

export const GeneralBuilder = InternalBuilder.GeneralBuilder<TPjsApi, Extrinsic>

export const EvmBuilder = (provider?: AbstractProvider) => {
  const pjsApi = new PolkadotJsApi()
  return InternalEvmBuilder.EvmBuilder<TPjsApi, Extrinsic>(pjsApi, provider)
}
