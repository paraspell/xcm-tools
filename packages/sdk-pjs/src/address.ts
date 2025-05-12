import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-core'
import { convertSs58 as convertSs58Impl } from '@paraspell/sdk-core'

import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi } from './types'

export const convertSs58 = (address: string, node: TNodeDotKsmWithRelayChains) => {
  const papiApi = new PolkadotJsApi()
  return convertSs58Impl<TPjsApi, Extrinsic>(papiApi, address, node)
}
