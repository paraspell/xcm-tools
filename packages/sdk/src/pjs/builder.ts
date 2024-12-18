import * as InternalBuilder from '../builder'
import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from './types'

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
const Builder = (api?: TPjsApiOrUrl) => {
  const pjsApi = new PolkadotJsApi()
  pjsApi.setApi(api)
  return InternalBuilder.Builder<TPjsApi, Extrinsic>(pjsApi)
}

const GeneralBuilder = InternalBuilder.GeneralBuilder<TPjsApi, Extrinsic>

export { Builder, GeneralBuilder }
export * from '../builder/evm-builder/EvmBuilder'
