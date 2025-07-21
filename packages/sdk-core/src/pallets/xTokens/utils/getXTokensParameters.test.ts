import type { TMultiAssetWithFee } from '@paraspell/assets'
import { type TMultiLocation, Version } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { DOT_MULTILOCATION } from '../../../constants'
import { getXTokensParameters } from './getXTokensParameters'

describe('getXTokensParameters', () => {
  const mockMultiLocation: TMultiLocation = DOT_MULTILOCATION
  const mockVersionedMultiLocation = {
    [Version.V4]: mockMultiLocation
  }

  const createMockAsset = (parachain: number, isFeeAsset = false): TMultiAssetWithFee => ({
    ...(isFeeAsset && { isFeeAsset }),
    id: {
      parents: 0,
      interior: {
        X2: [{ PalletInstance: '50' }, { Parachain: parachain.toString() }]
      }
    },
    fun: { Fungible: 123456n }
  })

  const version = Version.V4

  it('should return params for single asset (non-multi-asset)', () => {
    const result = getXTokensParameters(false, 'DOT', mockMultiLocation, '1000', '10', version)

    expect(result).toEqual({
      currency_id: 'DOT',
      amount: 1000n,
      dest: mockVersionedMultiLocation,
      dest_weight_limit: '10'
    })
  })

  it('should return params for multi-asset without fee asset', () => {
    const result = getXTokensParameters(true, 'DOT', mockMultiLocation, '1000', '10', version)

    expect(result).toEqual({
      asset: 'DOT',
      dest: mockVersionedMultiLocation,
      dest_weight_limit: '10'
    })
  })

  it('should include fee_item index when fee asset is present (index 0)', () => {
    const multiAssets = [createMockAsset(1337, true), createMockAsset(30)]

    const result = getXTokensParameters(
      true,
      'DOT',
      mockMultiLocation,
      '1000',
      '10',
      version,
      multiAssets
    )

    expect(result).toEqual({
      assets: 'DOT',
      fee_item: 0,
      dest: mockVersionedMultiLocation,
      dest_weight_limit: '10'
    })
  })

  it('should include fee_item index when fee asset is present (index 1)', () => {
    const multiAssets = [createMockAsset(30), createMockAsset(1337, true)]

    const result = getXTokensParameters(
      true,
      'DOT',
      mockMultiLocation,
      '1000',
      20,
      version,
      multiAssets
    )

    expect(result).toEqual({
      assets: 'DOT',
      fee_item: 1,
      dest: mockVersionedMultiLocation,
      dest_weight_limit: 20
    })
  })

  it('should not include fee_item if no fee asset is marked', () => {
    const multiAssets = [createMockAsset(1), createMockAsset(2)]

    const result = getXTokensParameters(
      true,
      'DOT',
      mockMultiLocation,
      '1000',
      '5',
      version,
      multiAssets
    )

    expect(result).toEqual({
      assets: 'DOT',
      fee_item: 0,
      dest: mockVersionedMultiLocation,
      dest_weight_limit: '5'
    })
  })
})
