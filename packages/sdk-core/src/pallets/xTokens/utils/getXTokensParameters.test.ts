import { describe, it, expect } from 'vitest'
import { getXTokensParameters } from './getXTokensParameters'
import type { TMultiAssetWithFee, TMultiLocation, TXcmVersioned } from '../../../types'
import { Parents, Version } from '../../../types'

const mockMultiLocationHeader: TXcmVersioned<TMultiLocation> = {
  [Version.V4]: {
    parents: Parents.ONE,
    interior: 'Here'
  }
}

describe('getXTokensParameters', () => {
  it('returns correct parameters for non-AssetHub without multi-assets', () => {
    const result = getXTokensParameters(false, 'DOT', mockMultiLocationHeader, '1000', '10')
    expect(result).toEqual({
      currency_id: 'DOT',
      amount: 1000n,
      dest: mockMultiLocationHeader,
      dest_weight_limit: '10'
    })
  })

  it('returns correct parameters for non-AssetHub with multi-assets', () => {
    const currency: TMultiAssetWithFee[] = [
      {
        id: {
          Concrete: {
            parents: 0,
            interior: {
              X2: [
                {
                  PalletInstance: '50'
                },
                {
                  Parachain: '30'
                }
              ]
            }
          }
        },

        fun: {
          Fungible: '102928'
        }
      },
      {
        isFeeAsset: true,
        id: {
          Concrete: {
            parents: 0,
            interior: {
              X2: [
                {
                  PalletInstance: '50'
                },
                {
                  Parachain: '1337'
                }
              ]
            }
          }
        },
        fun: {
          Fungible: '38482'
        }
      }
    ]

    const result = getXTokensParameters(
      false,
      'DOT',
      mockMultiLocationHeader,
      '1000',
      '10',
      currency
    )
    expect(result).toEqual({
      currency_id: 'DOT',
      amount: 1000n,
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
    const currency: TMultiAssetWithFee[] = [
      {
        isFeeAsset: true,
        id: {
          Concrete: {
            parents: 0,
            interior: {
              X2: [
                {
                  PalletInstance: '50'
                },
                {
                  Parachain: '1337'
                }
              ]
            }
          }
        },
        fun: {
          Fungible: '38482'
        }
      },
      {
        id: {
          Concrete: {
            parents: 0,
            interior: {
              X2: [
                {
                  PalletInstance: '50'
                },
                {
                  Parachain: '30'
                }
              ]
            }
          }
        },

        fun: {
          Fungible: '102928'
        }
      }
    ]
    const result = getXTokensParameters(
      true,
      'DOT',
      mockMultiLocationHeader,
      '1000',
      '10',
      currency
    )
    expect(result).toEqual({
      assets: 'DOT',
      fee_item: 0,
      dest: mockMultiLocationHeader,
      dest_weight_limit: '10'
    })
  })

  it('handles numeric fees correctly', () => {
    const currency: TMultiAssetWithFee[] = [
      {
        id: {
          Concrete: {
            parents: 0,
            interior: {
              X2: [
                {
                  PalletInstance: '50'
                },
                {
                  Parachain: '30'
                }
              ]
            }
          }
        },

        fun: {
          Fungible: '102928'
        }
      },
      {
        isFeeAsset: true,
        id: {
          Concrete: {
            parents: 0,
            interior: {
              X2: [
                {
                  PalletInstance: '50'
                },
                {
                  Parachain: '1337'
                }
              ]
            }
          }
        },
        fun: {
          Fungible: '38482'
        }
      }
    ]
    const result = getXTokensParameters(true, 'DOT', mockMultiLocationHeader, '1000', 20, currency)
    expect(result).toEqual({
      assets: 'DOT',
      fee_item: 1,
      dest: mockMultiLocationHeader,
      dest_weight_limit: 20
    })
  })
})
