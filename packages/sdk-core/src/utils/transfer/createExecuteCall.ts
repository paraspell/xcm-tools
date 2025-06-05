import type { TSerializedApiCall, TWeight, TXcmVersioned } from '../../types'

export const createExecuteCall = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xcm: TXcmVersioned<any>,
  maxWeight: TWeight
): TSerializedApiCall => {
  return {
    module: 'PolkadotXcm',
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
