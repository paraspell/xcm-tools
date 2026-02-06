import { getOtherAssets, InvalidCurrencyError } from '@paraspell/assets'
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
    const options = {
      asset: { symbol: 'DOT', isNative: true, amount: 500n },
      destination: 'Polkadot',
      version
    } as TXTokensTransferOptions<unknown, unknown, unknown>

    const expected = {
      [version]: createAsset(version, options.asset.amount, DOT_LOCATION)
    }

    expect(getModifiedCurrencySelection(options)).toEqual(expected)
  })

  it('returns assetHubAsset.location when non-foreign asset is found in AssetHub', () => {
    const version = Version.V4
    const options = {
      asset: { symbol: 'DOT', isNative: true, amount: 1000n },
      destination: 'AssetHubPolkadot',
      version
    } as TXTokensTransferOptions<unknown, unknown, unknown>

    vi.mocked(getOtherAssets).mockReturnValue([
      {
        symbol: 'DOT',
        decimals: 10,
        location: { parents: Parents.ONE, interior: 'Here' }
      }
    ])

    const result = getModifiedCurrencySelection(options)

    expect(result).toEqual({
      [version]: {
        id: {
          parents: Parents.ONE,
          interior: 'Here'
        },
        fun: {
          Fungible: options.asset.amount
        }
      }
    })
  })

  it('throws InvalidCurrencyError when non-foreign asset is not found in AssetHub', () => {
    const version = Version.V4
    const options = {
      asset: { symbol: 'UNKNOWN', isNative: true, amount: 500n },
      destination: 'AssetHubPolkadot',
      version
    } as TXTokensTransferOptions<unknown, unknown, unknown>

    vi.mocked(getOtherAssets).mockReturnValue([])

    expect(() => getModifiedCurrencySelection(options)).toThrow(InvalidCurrencyError)
  })

  it('returns location from asset when asset is foreign and location defined and version is V3', () => {
    const version = Version.V3
    const options = {
      asset: {
        location: { parents: Parents.ONE, interior: 'Here' },
        amount: 1500n
      },
      version
    } as TXTokensTransferOptions<unknown, unknown, unknown>

    const result = getModifiedCurrencySelection(options)

    expect(result).toEqual({
      [version]: {
        id: {
          Concrete: {
            parents: Parents.ONE,
            interior: 'Here'
          }
        },
        fun: {
          Fungible: options.asset.amount
        }
      }
    })
  })
})
