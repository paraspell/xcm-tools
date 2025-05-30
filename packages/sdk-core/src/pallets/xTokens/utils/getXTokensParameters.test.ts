import type { TMultiAssetWithFee } from '@paraspell/assets'
import { Parents, type TMultiLocation } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import type { TXcmVersioned } from '../../../types'
import { Version } from '../../../types'
import { getXTokensParameters } from './getXTokensParameters'

const mockMultiLocationHeader: TXcmVersioned<TMultiLocation> = {
  [Version.V4]: {
    parents: Parents.ONE,
    interior: 'Here'
  }
}

const createMockAsset = (parachain: number, isFeeAsset = false): TMultiAssetWithFee => ({
  ...(isFeeAsset && { isFeeAsset }),
  id: {
    Concrete: {
      parents: 0,
      interior: {
        X2: [{ PalletInstance: '50' }, { Parachain: parachain.toString() }]
      }
    }
  },
  fun: { Fungible: '123456' }
})

describe('getXTokensParameters', () => {
  it('should return params for single asset (non-multi-asset)', () => {
    const result = getXTokensParameters(false, 'DOT', mockMultiLocationHeader, '1000', '10')

    expect(result).toEqual({
      currency_id: 'DOT',
      amount: 1000n,
      dest: mockMultiLocationHeader,
      dest_weight_limit: '10'
    })
  })

  it('should return params for multi-asset without fee asset', () => {
    const result = getXTokensParameters(true, 'DOT', mockMultiLocationHeader, '1000', '10')

    expect(result).toEqual({
      asset: 'DOT',
      dest: mockMultiLocationHeader,
      dest_weight_limit: '10'
    })
  })

  it('should include fee_item index when fee asset is present (index 0)', () => {
    const multiAssets = [createMockAsset(1337, true), createMockAsset(30)]

    const result = getXTokensParameters(
      true,
      'DOT',
      mockMultiLocationHeader,
      '1000',
      '10',
      multiAssets
    )

    expect(result).toEqual({
      assets: 'DOT',
      fee_item: 0,
      dest: mockMultiLocationHeader,
      dest_weight_limit: '10'
    })
  })

  it('should include fee_item index when fee asset is present (index 1)', () => {
    const multiAssets = [createMockAsset(30), createMockAsset(1337, true)]

    const result = getXTokensParameters(
      true,
      'DOT',
      mockMultiLocationHeader,
      '1000',
      20,
      multiAssets
    )

    expect(result).toEqual({
      assets: 'DOT',
      fee_item: 1,
      dest: mockMultiLocationHeader,
      dest_weight_limit: 20
    })
  })

  it('should not include fee_item if no fee asset is marked', () => {
    const multiAssets = [createMockAsset(1), createMockAsset(2)]

    const result = getXTokensParameters(
      true,
      'DOT',
      mockMultiLocationHeader,
      '1000',
      '5',
      multiAssets
    )

    expect(result).toEqual({
      assets: 'DOT',
      fee_item: 0,
      dest: mockMultiLocationHeader,
      dest_weight_limit: '5'
    })
  })
})
