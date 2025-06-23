import { describe, expect, it } from 'vitest'

import type { TSerializedApiCall, TWeight, TXcmVersioned } from '../../../types'
import { createExecuteCall } from './createExecuteCall'

describe('createExecuteCall', () => {
  const mockChain = 'Hydration'

  it('should return correct serialized api call with given xcm and maxWeight', () => {
    const fakeXcm = {
      V4: [{ someInstruction: 'someValue' }]
    } as TXcmVersioned<unknown>

    const maxWeight: TWeight = {
      refTime: 123n,
      proofSize: 456n
    }

    const expected: TSerializedApiCall = {
      module: 'PolkadotXcm',
      method: 'execute',
      parameters: {
        message: fakeXcm,
        max_weight: {
          ref_time: 123n,
          proof_size: 456n
        }
      }
    }

    const result = createExecuteCall(mockChain, fakeXcm, maxWeight)

    expect(result).toEqual(expected)
  })
})
