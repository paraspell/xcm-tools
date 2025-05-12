import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-core'
import { convertSs58 as convertSs58Impl } from '@paraspell/sdk-core'
import type { PolkadotClient } from 'polkadot-api'

import PapiApi from './PapiApi'
import type { TPapiTransaction } from './types'

export const convertSs58 = (address: string, node: TNodeDotKsmWithRelayChains) => {
  const papiApi = new PapiApi()
  return convertSs58Impl<PolkadotClient, TPapiTransaction>(papiApi, address, node)
}
