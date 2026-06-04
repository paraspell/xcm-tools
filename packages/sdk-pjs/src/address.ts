import type { TSubstrateChain } from '@paraspell/sdk-core'
import { convertSs58 as convertSs58Impl } from '@paraspell/sdk-core'

import PolkadotJsApi from './PolkadotJsApi'

export const convertSs58 = (address: string, chain: TSubstrateChain) => {
  const papiApi = new PolkadotJsApi()
  return convertSs58Impl(papiApi, address, chain)
}
