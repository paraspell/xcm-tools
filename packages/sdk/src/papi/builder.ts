import type { AbstractProvider } from 'ethers'
import * as InternalBuilder from '../builder'
import * as InternalEvmBuilder from '../builder/evm-builder/EvmBuilder'
import PapiApi from './PapiApi'
import type { TPapiApiOrUrl, TPapiApi, TPapiTransaction } from './types'

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
export const Builder = (api?: TPapiApiOrUrl) => {
  const papiApi = new PapiApi()
  papiApi.setApi(api)
  return InternalBuilder.Builder<TPapiApi, TPapiTransaction>(papiApi)
}

export const GeneralBuilder = InternalBuilder.GeneralBuilder<TPapiApi, TPapiTransaction>

export const EvmBuilder = (provider?: AbstractProvider) => {
  const papiApi = new PapiApi()
  return InternalEvmBuilder.EvmBuilder<TPapiApi, TPapiTransaction>(papiApi, provider)
}
