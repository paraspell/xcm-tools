import { isRelayChain, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import type { TSerializedApiCall, TWeight, TXcmVersioned } from '../../../types'

export const createExecuteCall = (
  chain: TNodeDotKsmWithRelayChains,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xcm: TXcmVersioned<any>,
  maxWeight: TWeight
): TSerializedApiCall => {
  return {
    module: isRelayChain(chain) ? 'XcmPallet' : 'PolkadotXcm',
    method: 'execute',
    parameters: {
      message: xcm,
      max_weight: {
        ref_time: maxWeight.refTime,
        proof_size: maxWeight.proofSize
      }
    }
  }
}
