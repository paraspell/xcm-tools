import { describe, it, expect } from 'vitest'
import { NodeNotSupportedError } from '../../errors'
import { determineDestWeight } from './determineDestWeight'
import type { TNode } from '../../types'

describe('determineDestWeight', () => {
  it('returns correct weight for Astar', () => {
    const result = determineDestWeight('Astar')
    expect(result).toEqual({ refTime: '6000000000', proofSize: '1000000' })
  })

  it('returns correct weight for Moonbeam', () => {
    const result = determineDestWeight('Moonbeam')
    expect(result).toEqual({ refTime: '5000000000', proofSize: '0' })
  })

  it('returns correct weight for Hydration', () => {
    const result = determineDestWeight('Hydration')
    expect(result).toEqual({ refTime: '5000000000', proofSize: '0' })
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
