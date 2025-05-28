import { getOtherAssets, isForeignAsset } from '@paraspell/assets'
import { Parents } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DOT_MULTILOCATION } from '../../../constants'
import { type TXTokensTransferOptions, Version } from '../../../types'
import { createMultiAsset } from '../../xcmPallet/utils'
import { getModifiedCurrencySelection } from './getModifiedCurrencySelection'

vi.mock('@paraspell/assets', () => ({
  isForeignAsset: vi.fn(),
  getOtherAssets: vi.fn(),
  InvalidCurrencyError: class InvalidCurrencyError extends Error {}
}))

describe('getModifiedCurrencySelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error when asset is not foreign and destination is relaychain', () => {
    const version = Version.V1
    const paraIdTo = 1000

    const xTransferInput = {
      asset: { symbol: 'DOT', amount: '500' },
      paraIdTo,
      destination: 'Polkadot'
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(false)

    expect(getModifiedCurrencySelection(version, xTransferInput)).toEqual({
      [version]: createMultiAsset(version, xTransferInput.asset.amount, DOT_MULTILOCATION)
    })
  })

  it('returns assetHubAsset.multiLocation when asset is not foreign and assetHubAsset.multiLocation is defined', () => {
    const version = Version.V1
    const paraIdTo = 1000
    const destination = 'AssetHubPolkadot'

    const xTransferInput = {
      asset: { symbol: 'DOT', amount: '1000' },
      paraIdTo,
      destination
    } as TXTokensTransferOptions<unknown, unknown>

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
          Fungible: xTransferInput.asset.amount
        }
      }
    })
  })

  it('throws InvalidCurrencyError when assetHubAsset is undefined', () => {
    const version = Version.V1
    const paraIdTo = 1000
    const destination = 'AssetHubPolkadot'

    const xTransferInput = {
      asset: { symbol: 'UNKNOWN', amount: '500' },
      paraIdTo,
      destination
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(getOtherAssets).mockReturnValue([])

    expect(() => getModifiedCurrencySelection(version, xTransferInput)).toThrow(
      'Asset UNKNOWN not found in AssetHub'
    )
  })

  it('returns default multiLocation for Bifrost origin', () => {
    const version = Version.V3
    const currencyID = '123'
    const paraIdTo = 2000
    const origin = 'BifrostPolkadot'

    const xTransferInput = {
      asset: { assetId: currencyID, amount: '1000' },
      paraIdTo,
      origin
    } as TXTokensTransferOptions<unknown, unknown>

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
          Fungible: xTransferInput.asset.amount
        }
      }
    })
  })

  it('returns asset.multiLocation when it is defined', () => {
    const version = Version.V3
    const paraIdTo = 3000

    const xTransferInput = {
      asset: {
        multiLocation: {
          parents: Parents.ONE,
          interior: 'Here'
        },
        amount: '1500'
      },
      paraIdTo
    } as TXTokensTransferOptions<unknown, unknown>

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
          Fungible: xTransferInput.asset.amount
        }
      }
    })
  })

  it('returns default multiLocation when asset.multiLocation is undefiend', () => {
    const version = Version.V3
    const currencyID = '123'
    const paraIdTo = 2000

    const xTransferInput = {
      asset: { assetId: currencyID, amount: '1000' },
      paraIdTo
    } as TXTokensTransferOptions<unknown, unknown>

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
          Fungible: xTransferInput.asset.amount
        }
      }
    })
  })
})
