import type { TSubstrateChain } from '@paraspell/sdk-core'
import { convertSs58 as convertSs58Impl } from '@paraspell/sdk-core'

import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsSigner } from './types'

export const convertSs58 = (address: string, chain: TSubstrateChain) => {
  const papiApi = new PolkadotJsApi()
  return convertSs58Impl<TPjsApi, Extrinsic, TPjsSigner>(papiApi, address, chain)
}
