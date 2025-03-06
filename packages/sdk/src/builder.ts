import type { GeneralBuilder as GeneralBuilderCore, TSendBaseOptions } from '@paraspell/sdk-core'
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
export const Builder = (api?: TPapiApiOrUrl) => {
  const papiApi = new PapiApi()
  papiApi.setApi(api)
  return BuilderImpl<PolkadotClient, TPapiTransaction>(papiApi)
}

export type GeneralBuilder<T extends Partial<TSendBaseOptions> = object> = GeneralBuilderCore<
  PolkadotClient,
  TPapiTransaction,
  T
>

export const EvmBuilder = () => {
  const papiApi = new PapiApi()
  return EvmBuilderImpl<TPapiApi, TPapiTransaction>(papiApi)
}
