import { describe, it, expect } from 'vitest'
import { getParameters } from './getParameters'
import type { TMultiLocationHeader } from '../../types'
import { Parents, Version } from '../../types'

const mockMultiLocationHeader: TMultiLocationHeader = {
  [Version.V4]: {
    parents: Parents.ONE,
    interior: 'Here'
  }
}

describe('getParameters', () => {
  it('returns correct parameters for non-AssetHub without feeAsset', () => {
    const result = getParameters(false, 'DOT', mockMultiLocationHeader, '1000', '10')
    expect(result).toEqual(['DOT', '1000', mockMultiLocationHeader, '10'])
  })

  it('returns correct parameters for non-AssetHub with feeAsset', () => {
    const result = getParameters(false, 'DOT', mockMultiLocationHeader, '1000', '10', 'KSM')
    // feeAsset should not affect the output
    expect(result).toEqual(['DOT', '1000', mockMultiLocationHeader, '10'])
  })

  it('returns correct parameters for AssetHub without feeAsset', () => {
    const result = getParameters(true, 'DOT', mockMultiLocationHeader, '1000', '10')
    expect(result).toEqual(['DOT', mockMultiLocationHeader, '10'])
  })

  it('returns correct parameters for AssetHub with feeAsset', () => {
    const result = getParameters(true, 'DOT', mockMultiLocationHeader, '1000', '10', 'KSM')
    expect(result).toEqual(['DOT', 'KSM', mockMultiLocationHeader, '10'])
  })

  it('handles numeric fees correctly', () => {
    const result = getParameters(true, 'DOT', mockMultiLocationHeader, '1000', 20, 'KSM')
    expect(result).toEqual(['DOT', 'KSM', mockMultiLocationHeader, 20])
  })
})
