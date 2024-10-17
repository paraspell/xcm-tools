import * as InternalBuilder from '../builder'
import type { PolkadotClient } from 'polkadot-api'
import PapiApi from './PapiApi'
import type { TPapiTransaction } from './types'

const Builder = (api?: PolkadotClient) => {
  const papiApi = new PapiApi()
  papiApi.setApi(api)
  return InternalBuilder.Builder<PolkadotClient, TPapiTransaction>(papiApi)
}

type UseKeepAliveFinalBuilder = InternalBuilder.UseKeepAliveFinalBuilder<
  PolkadotClient,
  TPapiTransaction
>

const GeneralBuilder = InternalBuilder.GeneralBuilder<PolkadotClient, TPapiTransaction>

export { Builder, UseKeepAliveFinalBuilder, GeneralBuilder }
export * from '../builder/builders/evm-builder/EvmBuilder'
