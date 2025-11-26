import { getOtherAssets, InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import { Parents, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DOT_LOCATION } from '../../../constants'
import type { TXTokensTransferOptions } from '../../../types'
import { createAsset } from '../../../utils/asset'
import { getModifiedCurrencySelection } from './currencySelection'

vi.mock('@paraspell/assets')

describe('getModifiedCurrencySelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns default DOT location when asset is non-foreign and destination is relay chain', () => {
    const version = Version.V4
    const xTransferInput = {
      asset: { symbol: 'DOT', amount: 500n },
      destination: 'Polkadot',
      version
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(false)

    const expected = {
      [version]: createAsset(version, xTransferInput.asset.amount, DOT_LOCATION)
    }

    expect(getModifiedCurrencySelection(xTransferInput)).toEqual(expected)
  })

  it('returns assetHubAsset.location when non-foreign asset is found in AssetHub', () => {
    const version = Version.V4
    const xTransferInput = {
      asset: { symbol: 'DOT', amount: 1000n },
      destination: 'AssetHubPolkadot',
      version
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(getOtherAssets).mockReturnValue([
      {
        symbol: 'DOT',
        decimals: 10,
        location: { parents: Parents.ONE, interior: 'Here' }
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
      asset: { symbol: 'UNKNOWN', amount: 500n },
      destination: 'AssetHubPolkadot',
      version
    } as TXTokensTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(getOtherAssets).mockReturnValue([])

    expect(() => getModifiedCurrencySelection(xTransferInput)).toThrow(InvalidCurrencyError)
  })

  it('returns location from asset when asset is foreign and location defined and version is V3', () => {
    const version = Version.V3
    const xTransferInput = {
      asset: {
        location: { parents: Parents.ONE, interior: 'Here' },
        amount: 1500n
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

  it('builds default location for foreign asset when location is undefined', () => {
    const version = Version.V4
    const currencyID = '123'
    const paraIdTo = 2000

    const xTransferInput = {
      asset: { assetId: currencyID, amount: 1000n },
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

  it('builds default location for foreign asset with Bifrost origin', () => {
    const version = Version.V4
    const currencyID = '123'
    const paraIdTo = 2000
    const origin = 'BifrostPolkadot'

    const xTransferInput = {
      asset: { assetId: currencyID, amount: 1000n },
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
