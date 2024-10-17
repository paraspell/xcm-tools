import type { ApiPromise } from '@polkadot/api'
import * as InternalBuilder from '../builder'
import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic } from './types'

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
const Builder = (api?: ApiPromise) => {
  const pjsApi = new PolkadotJsApi()
  pjsApi.setApi(api)
  return InternalBuilder.Builder<ApiPromise, Extrinsic>(pjsApi)
}

type UseKeepAliveFinalBuilder = InternalBuilder.UseKeepAliveFinalBuilder<ApiPromise, Extrinsic>

const GeneralBuilder = InternalBuilder.GeneralBuilder<ApiPromise, Extrinsic>

export { Builder, UseKeepAliveFinalBuilder, GeneralBuilder }
export * from '../builder/builders/evm-builder/EvmBuilder'
