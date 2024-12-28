import { describe, it, expect, vi } from 'vitest'
import { getNode } from '../../../utils'
import { getModifiedCurrencySelection } from './getModifiedCurrencySelection'
import { getCurrencySelection } from './getCurrencySelection'
import type { TCurrencySelectionHeader } from '../../../types'
import { Parents, Version, type TXTokensTransferOptions } from '../../../types'
import type ParachainNode from '../../../nodes/ParachainNode'

vi.mock('../../../utils', () => ({
  getNode: vi.fn()
}))

vi.mock('./getModifiedCurrencySelection', () => ({
  getModifiedCurrencySelection: vi.fn()
}))

const mockCurrencySelectionHeader: TCurrencySelectionHeader = {
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
  it('returns overrided currency multi-location when provided', () => {
    const input = {
      origin: 'Acala',
      asset: {
        assetId: '123',
        amount: '1000'
      },
      paraIdTo: 2000,
      overriddenAsset: {
        parents: Parents.ZERO,
        interior: 'Here'
      }
    } as TXTokensTransferOptions<unknown, unknown>
    const currencySelection = '123'
    const isAssetHub = false

    vi.mocked(getNode).mockReturnValue({ version: Version.V4 } as ParachainNode<unknown, unknown>)

    const result = getCurrencySelection(input, isAssetHub, currencySelection)
    expect(result).toEqual({ V4: input.overriddenAsset })
  })

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
