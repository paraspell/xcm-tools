import { getOtherAssets, InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import { Parents, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DOT_MULTILOCATION } from '../../../constants'
import type { TXTokensTransferOptions } from '../../../types'
import { createMultiAsset } from '../../xcmPallet/utils'
import { getModifiedCurrencySelection } from './currencySelection'

vi.mock('@paraspell/assets', () => ({
  isForeignAsset: vi.fn(),
  getOtherAssets: vi.fn(),
  InvalidCurrencyError: class extends Error {}
}))

describe('getModifiedCurrencySelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns default DOT multiLocation when asset is non-foreign and destination is relay chain', () => {
    const version = Version.V4
    const xTransferInput = {
      asset: { symbol: 'DOT', amount: '500' },
      destination: 'Polkadot',
      version
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(false)

    const expected = {
      [version]: createMultiAsset(version, xTransferInput.asset.amount, DOT_MULTILOCATION)
    }

    expect(getModifiedCurrencySelection(xTransferInput)).toEqual(expected)
  })

  it('returns assetHubAsset.multiLocation when non-foreign asset is found in AssetHub', () => {
    const version = Version.V4
    const xTransferInput = {
      asset: { symbol: 'DOT', amount: '1000' },
      destination: 'AssetHubPolkadot',
      version
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        symbol: 'DOT',
        multiLocation: { parents: Parents.ONE, interior: 'Here' }
      }
    ])

    const result = getModifiedCurrencySelection(xTransferInput)

    expect(result).toEqual({
      [version]: {
        id: {
          parents: Parents.ONE,
          interior: 'Here'
        },
        fun: {
          Fungible: xTransferInput.asset.amount
        }
      }
    })
  })

  it('throws InvalidCurrencyError when non-foreign asset is not found in AssetHub', () => {
    const version = Version.V4
    const xTransferInput = {
      asset: { symbol: 'UNKNOWN', amount: '500' },
      destination: 'AssetHubPolkadot',
      version
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(getOtherAssets).mockReturnValue([])

    expect(() => getModifiedCurrencySelection(xTransferInput)).toThrow(InvalidCurrencyError)
  })

  it('returns multiLocation from asset when asset is foreign and multiLocation defined and version is V3', () => {
    const version = Version.V3
    const xTransferInput = {
      asset: {
        multiLocation: { parents: Parents.ONE, interior: 'Here' },
        amount: '1500'
      },
      version
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(true)

    const result = getModifiedCurrencySelection(xTransferInput)

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

  it('builds default multiLocation for foreign asset when multiLocation is undefined', () => {
    const version = Version.V4
    const currencyID = '123'
    const paraIdTo = 2000

    const xTransferInput = {
      asset: { assetId: currencyID, amount: '1000' },
      paraIdTo,
      version
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(true)

    const result = getModifiedCurrencySelection(xTransferInput)

    expect(result).toEqual({
      [version]: {
        id: {
          parents: Parents.ONE,
          interior: {
            X3: [
              { Parachain: paraIdTo },
              { PalletInstance: '50' },
              { GeneralIndex: BigInt(currencyID) }
            ]
          }
        },
        fun: {
          Fungible: xTransferInput.asset.amount
        }
      }
    })
  })

  it('builds default multiLocation for foreign asset with Bifrost origin', () => {
    const version = Version.V4
    const currencyID = '123'
    const paraIdTo = 2000
    const origin = 'BifrostPolkadot'

    const xTransferInput = {
      asset: { assetId: currencyID, amount: '1000' },
      paraIdTo,
      origin,
      version
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(true)

    const result = getModifiedCurrencySelection(xTransferInput)

    expect(result).toEqual({
      [version]: {
        id: {
          parents: Parents.ONE,
          interior: {
            X3: [
              { Parachain: paraIdTo },
              { PalletInstance: '50' },
              { GeneralIndex: BigInt(currencyID) }
            ]
          }
        },
        fun: {
          Fungible: xTransferInput.asset.amount
        }
      }
    })
  })
})
