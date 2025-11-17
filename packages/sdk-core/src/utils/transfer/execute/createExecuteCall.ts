import { isRelayChain, type TSubstrateChain } from '@paraspell/sdk-common'

import type { TSerializedExtrinsics, TWeight, TXcmVersioned } from '../../../types'

export const createExecuteCall = (
  chain: TSubstrateChain,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xcm: TXcmVersioned<any>,
  maxWeight: TWeight
): TSerializedExtrinsics => {
  return {
    module: isRelayChain(chain) ? 'XcmPallet' : 'PolkadotXcm',
    method: 'execute',
    params: {
      message: xcm,
      max_weight: {
        ref_time: maxWeight.refTime,
        proof_size: maxWeight.proofSize
      }
    }
  }
}
