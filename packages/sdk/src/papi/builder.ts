import * as InternalBuilder from '../builder'
import PapiApi from './PapiApi'
import type { TPapiApiOrUrl, TPapiApi, TPapiTransaction } from './types'

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
const Builder = (api?: TPapiApiOrUrl) => {
  const papiApi = new PapiApi()
  papiApi.setApi(api)
  return InternalBuilder.Builder<TPapiApi, TPapiTransaction>(papiApi)
}

const GeneralBuilder = InternalBuilder.GeneralBuilder<TPapiApi, TPapiTransaction>

export { Builder, GeneralBuilder }
export * from '../builder/evm-builder/EvmBuilder'
