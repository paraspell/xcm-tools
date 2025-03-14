import type { TMultiAsset } from '@paraspell/assets'
import { Parents } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type ParachainNode from '../../../nodes/ParachainNode'
import type { TXcmVersioned } from '../../../types'
import { type TXTokensTransferOptions, Version } from '../../../types'
import { getNode } from '../../../utils'
import { getCurrencySelection } from './getCurrencySelection'
import { getModifiedCurrencySelection } from './getModifiedCurrencySelection'

vi.mock('../../../utils', () => ({
  getNode: vi.fn()
}))

vi.mock('./getModifiedCurrencySelection', () => ({
  getModifiedCurrencySelection: vi.fn()
}))

const mockCurrencySelectionHeader: TXcmVersioned<TMultiAsset> = {
  [Version.V4]: {
    id: {
      Concrete: {
        parents: Parents.ONE,
        interior: {
          X3: [{ Parachain: 2000 }, { PalletInstance: '50' }, { GeneralIndex: '123' }]
        }
      }
    },
    fun: {
      Fungible: '1000'
    }
  }
}

describe('getCurrencySelection', () => {
  it('returns modified currency selection for asset hubs when no override is provided', () => {
    const input = {
      origin: 'Acala',
      asset: {
        assetId: '123',
        amount: '2000'
      },
      paraIdTo: 1000,
      overriddenAsset: undefined
    } as TXTokensTransferOptions<unknown, unknown>
    const currencySelection = '123'
    const isAssetHub = true

    vi.mocked(getNode).mockReturnValue({ version: Version.V4 } as ParachainNode<unknown, unknown>)
    vi.mocked(getModifiedCurrencySelection).mockReturnValue(mockCurrencySelectionHeader)

    const result = getCurrencySelection(input, isAssetHub, currencySelection)
    expect(result).toEqual(mockCurrencySelectionHeader)
  })

  it('returns the unmodified currency selection when not an asset hub and no override provided', () => {
    const input = {
      origin: 'Acala',
      asset: {
        assetId: '123',
        amount: '3000'
      },
      paraIdTo: 3000,
      overriddenAsset: undefined
    } as TXTokensTransferOptions<unknown, unknown>
    const currencySelection = '123'
    const isAssetHub = false

    vi.mocked(getNode).mockReturnValue({ version: Version.V4 } as ParachainNode<unknown, unknown>)

    const result = getCurrencySelection(input, isAssetHub, currencySelection)
    expect(result).toEqual(currencySelection)
  })
})
