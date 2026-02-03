import type {
  GeneralBuilder as GeneralBuilderCore,
  TBuilderOptions,
  TSendBaseOptions
} from '@paraspell/sdk-core'
import { Builder as BuilderImpl } from '@paraspell/sdk-core'
import type { AbstractProvider } from 'ethers'

import { EvmBuilder as EvmBuilderImpl } from './evm-builder/EvmBuilder'
import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl, TPjsSigner } from './types'

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
export const Builder = (api?: TBuilderOptions<TPjsApiOrUrl>) => {
  const pjsApi = new PolkadotJsApi(api)
  return BuilderImpl<TPjsApi, Extrinsic, TPjsSigner>(pjsApi)
}

export type GeneralBuilder<T extends Partial<TSendBaseOptions<Extrinsic>> = object> =
  GeneralBuilderCore<TPjsApi, Extrinsic, TPjsSigner, T>

export const EvmBuilder = (provider?: AbstractProvider, api?: TBuilderOptions<TPjsApiOrUrl>) => {
  const pjsApi = new PolkadotJsApi(api)
  return EvmBuilderImpl<TPjsApi, Extrinsic, TPjsSigner>(pjsApi, provider)
}
