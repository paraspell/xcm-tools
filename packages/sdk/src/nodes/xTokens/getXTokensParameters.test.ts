import { describe, it, expect } from 'vitest'
import { getXTokensParameters } from './getXTokensParameters'
import type { TMultiLocationHeader } from '../../types'
import { Parents, Version } from '../../types'

const mockMultiLocationHeader: TMultiLocationHeader = {
  [Version.V4]: {
    parents: Parents.ONE,
    interior: 'Here'
  }
}

describe('getXTokensParameters', () => {
  it('returns correct parameters for non-AssetHub without feeAsset', () => {
    const result = getXTokensParameters(false, 'DOT', mockMultiLocationHeader, '1000', '10')
    expect(result).toEqual({
      currency_id: 'DOT',
      amount: '1000',
      dest: mockMultiLocationHeader,
      dest_weight_limit: '10'
    })
  })

  it('returns correct parameters for non-AssetHub with feeAsset', () => {
    const result = getXTokensParameters(false, 'DOT', mockMultiLocationHeader, '1000', '10', 'KSM')
    expect(result).toEqual({
      currency_id: 'DOT',
      amount: '1000',
      dest: mockMultiLocationHeader,
      dest_weight_limit: '10'
    })
  })

  it('returns correct parameters for AssetHub without feeAsset', () => {
    const result = getXTokensParameters(true, 'DOT', mockMultiLocationHeader, '1000', '10')
    expect(result).toEqual({
      asset: 'DOT',
      dest: mockMultiLocationHeader,
      dest_weight_limit: '10'
    })
  })

  it('returns correct parameters for AssetHub with feeAsset', () => {
    const result = getXTokensParameters(true, 'DOT', mockMultiLocationHeader, '1000', '10', 'KSM')
    expect(result).toEqual({
      assets: 'DOT',
      fee_item: 'KSM',
      dest: mockMultiLocationHeader,
      dest_weight_limit: '10'
    })
  })

  it('handles numeric fees correctly', () => {
    const result = getXTokensParameters(true, 'DOT', mockMultiLocationHeader, '1000', 20, 'KSM')
    expect(result).toEqual({
      assets: 'DOT',
      fee_item: 'KSM',
      dest: mockMultiLocationHeader,
      dest_weight_limit: 20
    })
  })
})
