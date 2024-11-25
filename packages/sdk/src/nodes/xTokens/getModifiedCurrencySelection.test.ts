import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getModifiedCurrencySelection } from './getModifiedCurrencySelection'
import { Version, Parents } from '../../types'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'
import type { TXTokensTransferOptions } from '../../types'

vi.mock('../../utils/assets', () => ({
  isForeignAsset: vi.fn()
}))

vi.mock('../../pallets/assets', () => ({
  getOtherAssets: vi.fn()
}))

import { isForeignAsset } from '../../utils/assets'
import { getOtherAssets } from '../../pallets/assets'
import { DOT_MULTILOCATION } from '../../const'
import { createMultiAsset } from '../../pallets/xcmPallet/utils'

describe('getModifiedCurrencySelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error when asset is not foreign and destination is undefined', () => {
    const version = Version.V1
    const amount = '500'
    const paraIdTo = 1000

    const xTransferInput = {
      amount,
      asset: { symbol: 'DOT' },
      paraIdTo,
      destination: undefined
    } as TXTokensTransferOptions<ApiPromise, Extrinsic>

    vi.mocked(isForeignAsset).mockReturnValue(false)

    expect(getModifiedCurrencySelection(version, xTransferInput)).toEqual({
      [version]: createMultiAsset(version, amount, DOT_MULTILOCATION)
    })
  })

  it('returns assetHubAsset.multiLocation when asset is not foreign and assetHubAsset.multiLocation is defined', () => {
    const version = Version.V1
    const amount = '1000'
    const paraIdTo = 1000
    const destination = 'AssetHubPolkadot'

    const xTransferInput = {
      amount,
      asset: { symbol: 'DOT' },
      paraIdTo,
      destination
    } as TXTokensTransferOptions<ApiPromise, Extrinsic>

    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        symbol: 'DOT',
        multiLocation: { parents: Parents.ONE, interior: 'Here' }
      }
    ])

    const result = getModifiedCurrencySelection(version, xTransferInput)
    expect(result).toEqual({
      [version]: {
        id: {
          Concrete: {
            parents: Parents.ONE,
            interior: 'Here'
          }
        },
        fun: {
          Fungible: amount
        }
      }
    })
  })

  it('returns assetHubAsset.xcmInterior when asset is not foreign and assetHubAsset.xcmInterior is defined', () => {
    const version = Version.V2
    const amount = '2000'
    const paraIdTo = 2000
    const destination = 'AssetHubPolkadot'

    const xTransferInput = {
      amount,
      asset: { symbol: 'KSM' },
      paraIdTo,
      destination
    } as TXTokensTransferOptions<ApiPromise, Extrinsic>

    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        symbol: 'KSM',
        xcmInterior: [{ NetworkId: 'Any' }]
      }
    ])

    const result = getModifiedCurrencySelection(version, xTransferInput)
    expect(result).toEqual({
      [version]: {
        id: {
          Concrete: {
            parents: Parents.ONE,
            interior: {
              X1: [{ NetworkId: 'Any' }]
            }
          }
        },
        fun: {
          Fungible: amount
        }
      }
    })
  })

  it('throws InvalidCurrencyError when assetHubAsset is undefined', () => {
    const version = Version.V1
    const amount = '500'
    const paraIdTo = 1000
    const destination = 'AssetHubPolkadot'

    const xTransferInput = {
      amount,
      asset: { symbol: 'UNKNOWN' },
      paraIdTo,
      destination
    } as TXTokensTransferOptions<ApiPromise, Extrinsic>

    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(getOtherAssets).mockReturnValue([])

    expect(() => getModifiedCurrencySelection(version, xTransferInput)).toThrow(
      'Asset UNKNOWN not found in AssetHub'
    )
  })

  it('returns default multiLocation for Bifrost origin', () => {
    const version = Version.V2
    const amount = '1000'
    const currencyID = '123'
    const paraIdTo = 2000
    const origin = 'BifrostPolkadot'

    const xTransferInput = {
      amount,
      asset: { assetId: currencyID },
      paraIdTo,
      origin
    } as TXTokensTransferOptions<ApiPromise, Extrinsic>

    vi.mocked(isForeignAsset).mockReturnValue(true)

    const result = getModifiedCurrencySelection(version, xTransferInput)
    expect(result).toEqual({
      [version]: {
        id: {
          Concrete: {
            parents: Parents.ONE,
            interior: {
              X3: [
                { Parachain: paraIdTo },
                { PalletInstance: '50' },
                { GeneralIndex: BigInt(currencyID) }
              ]
            }
          }
        },
        fun: {
          Fungible: amount
        }
      }
    })
  })

  it('returns asset.multiLocation when it is defined', () => {
    const version = Version.V3
    const amount = '1500'
    const paraIdTo = 3000

    const xTransferInput = {
      amount,
      asset: {
        multiLocation: {
          parents: Parents.ONE,
          interior: 'Here'
        }
      },
      paraIdTo
    } as TXTokensTransferOptions<ApiPromise, Extrinsic>

    vi.mocked(isForeignAsset).mockReturnValue(true)

    const result = getModifiedCurrencySelection(version, xTransferInput)
    expect(result).toEqual({
      [version]: {
        id: {
          Concrete: {
            parents: Parents.ONE,
            interior: 'Here'
          }
        },
        fun: {
          Fungible: amount
        }
      }
    })
  })

  it('returns asset.xcmInterior when asset.multiLocation is undefined but xcmInterior is defined', () => {
    const version = Version.V3
    const amount = '1500'
    const paraIdTo = 3000

    const xTransferInput = {
      amount,
      asset: {
        xcmInterior: [{ NetworkId: 'Any' }, { Parachain: paraIdTo }]
      },
      paraIdTo
    } as TXTokensTransferOptions<ApiPromise, Extrinsic>

    vi.mocked(isForeignAsset).mockReturnValue(true)

    const result = getModifiedCurrencySelection(version, xTransferInput)
    expect(result).toEqual({
      [version]: {
        id: {
          Concrete: {
            parents: Parents.ONE,
            interior: {
              X2: [{ NetworkId: 'Any' }, { Parachain: paraIdTo }]
            }
          }
        },
        fun: {
          Fungible: amount
        }
      }
    })
  })

  it('returns default multiLocation when asset.multiLocation and xcmInterior are undefined', () => {
    const version = Version.V2
    const amount = '1000'
    const currencyID = '123'
    const paraIdTo = 2000

    const xTransferInput = {
      amount,
      asset: { assetId: currencyID },
      paraIdTo
    } as TXTokensTransferOptions<ApiPromise, Extrinsic>

    vi.mocked(isForeignAsset).mockReturnValue(true)

    const result = getModifiedCurrencySelection(version, xTransferInput)
    expect(result).toEqual({
      [version]: {
        id: {
          Concrete: {
            parents: Parents.ONE,
            interior: {
              X3: [
                { Parachain: paraIdTo },
                { PalletInstance: '50' },
                { GeneralIndex: BigInt(currencyID) }
              ]
            }
          }
        },
        fun: {
          Fungible: amount
        }
      }
    })
  })
})
