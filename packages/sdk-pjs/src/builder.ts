import type {
  GeneralBuilder as GeneralBuilderCore,
  TApiOrUrl,
  TBuilderOptions,
  TCustomChainFrom,
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
 * @param options - Either an existing API instance, a WS URL, or a config object.
 * @returns A new Builder instance.
 */
export const Builder = <const TOpts extends TBuilderOptions<TApiOrUrl<TPjsApi>>>(
  options?: TOpts
) => {
  const pjsApi = new PolkadotJsApi(options)
  return BuilderImpl<TPjsApi, Extrinsic, TPjsSigner, TCustomChainFrom<TOpts>>(pjsApi)
}

export type GeneralBuilder<
  T extends Partial<TTransferBaseOptions<TPjsApi, Extrinsic, TPjsSigner>> = object,
  TCustomChain extends string = never
> = GeneralBuilderCore<TPjsApi, Extrinsic, TPjsSigner, T, TCustomChain>

/** @deprecated EvmBuilder is deprecated. Please use the Builder class instead. */
export const EvmBuilder = (
  provider?: AbstractProvider,
  api?: TBuilderOptions<TApiOrUrl<TPjsApi>>
) => {
  const pjsApi = new PolkadotJsApi(api)
  return EvmBuilderImpl<TPjsApi, Extrinsic, TPjsSigner>(pjsApi, provider)
}
