import { Builder as BuilderImpl, GeneralBuilder as GeneralBuilderImpl } from '@paraspell/sdk-core'
import { EvmBuilder as EvmBuilderImpl } from './evm-builder/EvmBuilder'
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
  return BuilderImpl<TPapiApi, TPapiTransaction>(papiApi)
}

export const GeneralBuilder = GeneralBuilderImpl<TPapiApi, TPapiTransaction>

export const EvmBuilder = () => {
  const papiApi = new PapiApi()
  return EvmBuilderImpl<TPapiApi, TPapiTransaction>(papiApi)
}
