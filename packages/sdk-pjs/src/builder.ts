import type {
  GeneralBuilder as GeneralBuilderCore,
  TApiOrUrl,
  TBuilderOptions,
  TTransferBaseOptions
} from '@paraspell/sdk-core'
import { Builder as BuilderImpl } from '@paraspell/sdk-core'
import type { AbstractProvider } from 'ethers'

import { EvmBuilder as EvmBuilderImpl } from './evm-builder/EvmBuilder'
import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsSigner } from './types'

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
export const Builder = (api?: TBuilderOptions<TApiOrUrl<TPjsApi>>) => {
  const pjsApi = new PolkadotJsApi(api)
  return BuilderImpl<TPjsApi, Extrinsic, TPjsSigner>(pjsApi)
}

export type GeneralBuilder<
  T extends Partial<TTransferBaseOptions<TPjsApi, Extrinsic, TPjsSigner>> = object
> = GeneralBuilderCore<TPjsApi, Extrinsic, TPjsSigner, T>

/** @deprecated EvmBuilder is deprecated. Please use the Builder class instead. */
export const EvmBuilder = (
  provider?: AbstractProvider,
  api?: TBuilderOptions<TApiOrUrl<TPjsApi>>
) => {
  const pjsApi = new PolkadotJsApi(api)
  return EvmBuilderImpl<TPjsApi, Extrinsic, TPjsSigner>(pjsApi, provider)
}
