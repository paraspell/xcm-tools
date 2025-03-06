import { describe, expect, it } from 'vitest'

import { NodeNotSupportedError } from '../../../errors'
import type { TNode } from '../../../types'
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
    const unsupportedNode: TNode = 'Altair'
    expect(() => determineDestWeight(unsupportedNode)).toThrow(NodeNotSupportedError)
    expect(() => determineDestWeight(unsupportedNode)).toThrow(
      `Node ${unsupportedNode} is not supported`
    )
  })

  it('throws an error when destNode is undefined', () => {
    expect(() => determineDestWeight()).toThrow(NodeNotSupportedError)
    expect(() => determineDestWeight()).toThrow('Node undefined is not supported')
  })
})
