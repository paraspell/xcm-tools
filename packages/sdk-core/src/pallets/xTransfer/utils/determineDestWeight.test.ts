import type { TNode } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { NodeNotSupportedError } from '../../../errors'
import { determineDestWeight } from './determineDestWeight'

describe('determineDestWeight', () => {
  it('returns correct weight for Astar', () => {
    const result = determineDestWeight('Astar')
    expect(result).toEqual({ ref_time: 6000000000n, proof_size: 1000000n })
  })

  it('returns correct weight for Moonbeam', () => {
    const result = determineDestWeight('Moonbeam')
    expect(result).toEqual({ ref_time: 5000000000n, proof_size: 0n })
  })

  it('returns correct weight for Hydration', () => {
    const result = determineDestWeight('Hydration')
    expect(result).toEqual({ ref_time: 5000000000n, proof_size: 0n })
  })

  it('throws an error for unsupported nodes', () => {
    const dest: TNode = 'Altair'
    expect(() => determineDestWeight(dest)).toThrow(NodeNotSupportedError)
    expect(() => determineDestWeight(dest)).toThrow(
      `Pallet XTransfer does not support transfering to ${dest}.`
    )
  })
})
