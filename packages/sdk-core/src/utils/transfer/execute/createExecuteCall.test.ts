import { describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../../api'
import type { TSerializedExtrinsics, TWeight, TXcmVersioned } from '../../../types'
import { createExecuteCall } from './createExecuteCall'

describe('createExecuteCall', () => {
  const mockChain = 'Hydration'

  const fakeXcm = {
    V4: [{ someInstruction: 'someValue' }]
  } as TXcmVersioned<unknown>

  const maxWeight: TWeight = {
    refTime: 123n,
    proofSize: 456n
  }

  it('should return correct serialized api call with given xcm and maxWeight', () => {
    const expected: TSerializedExtrinsics = {
      module: 'PolkadotXcm',
      method: 'execute',
      params: {
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

  it('should take the XCM pallet of a custom chain from the api context', () => {
    const api = {
      getXcmPallet: vi.fn((chain: string) => (chain === 'MyChain' ? 'XcmPallet' : 'PolkadotXcm'))
    } as unknown as PolkadotApi<unknown, unknown, unknown, 'MyChain'>

    const result = createExecuteCall<'MyChain'>('MyChain', fakeXcm, maxWeight, api)

    expect(result).toEqual({
      module: 'XcmPallet',
      method: 'execute',
      params: {
        message: fakeXcm,
        max_weight: { ref_time: 123n, proof_size: 456n }
      }
    })
  })
})
