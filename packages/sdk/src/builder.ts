import type { GeneralBuilder as GeneralBuilderCore, TSendBaseOptions } from '@paraspell/sdk-core'
import type { TBuilderOptions } from '@paraspell/sdk-core'
import { Builder as BuilderImpl } from '@paraspell/sdk-core'
import type { PolkadotClient, PolkadotSigner } from 'polkadot-api'

import { EvmBuilder as EvmBuilderImpl } from './evm-builder/EvmBuilder'
import PapiApi from './PapiApi'
import type { TPapiApi, TPapiApiOrUrl, TPapiSigner, TPapiTransaction } from './types'

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
export const Builder = (api?: TBuilderOptions<TPapiApiOrUrl>) => {
  const papiApi = new PapiApi(api)
  return BuilderImpl<TPapiApi, TPapiTransaction, TPapiSigner>(papiApi)
}

export type GeneralBuilder<T extends Partial<TSendBaseOptions<TPapiTransaction>> = object> =
  GeneralBuilderCore<PolkadotClient, TPapiTransaction, PolkadotSigner, T>

export const EvmBuilder = (api?: TBuilderOptions<TPapiApiOrUrl>) => {
  const papiApi = new PapiApi(api)
  return EvmBuilderImpl<TPapiApi, TPapiTransaction, TPapiSigner>(papiApi)
}
