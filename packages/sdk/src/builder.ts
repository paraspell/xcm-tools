import type { TApiOrUrl } from '@paraspell/sdk-core'
import { Builder as BuilderImpl } from '@paraspell/sdk-core'
import { EvmBuilder as EvmBuilderImpl } from './evm-builder/EvmBuilder'
import PapiApi from './PapiApi'
import type { TPapiApi, TPapiTransaction } from './types'
import type { PolkadotClient } from 'polkadot-api'

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
export const Builder = (api?: TApiOrUrl<PolkadotClient>) => {
  const papiApi = new PapiApi()
  papiApi.setApi(api)
  return BuilderImpl<PolkadotClient, TPapiTransaction>(papiApi)
}

export const EvmBuilder = () => {
  const papiApi = new PapiApi()
  return EvmBuilderImpl<TPapiApi, TPapiTransaction>(papiApi)
}
