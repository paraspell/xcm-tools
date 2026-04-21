import type {
  GeneralBuilder as GeneralBuilderCore,
  TApiOrUrl,
  TTransferBaseOptions
} from '@paraspell/sdk-core'
import type { TBuilderOptions } from '@paraspell/sdk-core'
import { Builder as BuilderImpl } from '@paraspell/sdk-core'
import type { PolkadotClient, PolkadotSigner } from 'polkadot-api'

import { EvmBuilder as EvmBuilderImpl } from './evm-builder/EvmBuilder'
import PapiApi from './PapiApi'
import type { TPapiApi, TPapiSigner, TPapiTransaction } from './types'

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
export const Builder = (api?: TBuilderOptions<TApiOrUrl<TPapiApi>>) => {
  const papiApi = new PapiApi(api)
  return BuilderImpl<TPapiApi, TPapiTransaction, TPapiSigner>(papiApi)
}

export type GeneralBuilder<
  T extends Partial<TTransferBaseOptions<TPapiApi, TPapiTransaction, TPapiSigner>> = object
> = GeneralBuilderCore<PolkadotClient, TPapiTransaction, PolkadotSigner, T>

/** @deprecated EvmBuilder is deprecated. Please use the Builder class instead. */
export const EvmBuilder = (api?: TBuilderOptions<TApiOrUrl<TPapiApi>>) => {
  const papiApi = new PapiApi(api)
  return EvmBuilderImpl<TPapiApi, TPapiTransaction, TPapiSigner>(papiApi)
}
