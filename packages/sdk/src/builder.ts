import type {
  GeneralBuilder as GeneralBuilderCore,
  TApiOrUrl,
  TBuilderOptions,
  TCustomChainFrom,
  TTransferBaseOptions
} from '@paraspell/sdk-core'
import { Builder as BuilderImpl } from '@paraspell/sdk-core'
import type { PolkadotClient, PolkadotSigner } from 'polkadot-api'

import { EvmBuilder as EvmBuilderImpl } from './evm-builder/EvmBuilder'
import PapiApi from './PapiApi'
import type { TPapiApi, TPapiSigner, TPapiTransaction } from './types'

/**
 * Creates a new Builder instance.
 *
 * @param options - Either an existing API instance, a WS URL, or a config object.
 * @returns A new Builder instance.
 */
export const Builder = <const TOpts extends TBuilderOptions<TApiOrUrl<TPapiApi>>>(
  options?: TOpts
) => {
  const papiApi = new PapiApi(options)
  return BuilderImpl<TPapiApi, TPapiTransaction, TPapiSigner, TCustomChainFrom<TOpts>>(papiApi)
}

export type GeneralBuilder<
  T extends Partial<TTransferBaseOptions<TPapiApi, TPapiTransaction, TPapiSigner>> = object,
  TCustomChain extends string = never
> = GeneralBuilderCore<PolkadotClient, TPapiTransaction, PolkadotSigner, T, TCustomChain>

/** @deprecated EvmBuilder is deprecated. Please use the Builder class instead. */
export const EvmBuilder = (api?: TBuilderOptions<TApiOrUrl<TPapiApi>>) => {
  const papiApi = new PapiApi(api)
  return EvmBuilderImpl<TPapiApi, TPapiTransaction, TPapiSigner>(papiApi)
}
