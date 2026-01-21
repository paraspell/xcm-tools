import type { GeneralBuilder as GeneralBuilderCore, TSendBaseOptions } from '@paraspell/sdk-core'
import type { TBuilderOptions } from '@paraspell/sdk-core'
import { Builder as BuilderImpl } from '@paraspell/sdk-core'
import type { PolkadotClient } from 'polkadot-api'

import { EvmBuilder as EvmBuilderImpl } from './evm-builder/EvmBuilder'
import PapiApi from './PapiApi'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
export const Builder = (api?: TBuilderOptions<TPapiApiOrUrl>) => {
  const papiApi = new PapiApi(api)
  return BuilderImpl<PolkadotClient, TPapiTransaction>(papiApi)
}

export type GeneralBuilder<T extends Partial<TSendBaseOptions<TPapiTransaction>> = object> =
  GeneralBuilderCore<PolkadotClient, TPapiTransaction, T>

export const EvmBuilder = (api?: TBuilderOptions<TPapiApiOrUrl>) => {
  const papiApi = new PapiApi(api)
  return EvmBuilderImpl<TPapiApi, TPapiTransaction>(papiApi)
}
