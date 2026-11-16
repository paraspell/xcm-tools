import { getXcmPallet } from '@paraspell/pallets'
import { type TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../../api'
import type { TSerializedExtrinsics, TWeight, TXcmVersioned } from '../../../types'

/**
 * Builds an execute call, using the optional API context to resolve custom-chain pallets.
 */
export const createExecuteCall = <TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xcm: TXcmVersioned<any>,
  maxWeight: TWeight,
  api?: Pick<PolkadotApi<unknown, unknown, unknown, TCustomChain>, 'getXcmPallet'>
): TSerializedExtrinsics => {
  return {
    module: api ? api.getXcmPallet(chain) : getXcmPallet(chain),
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
