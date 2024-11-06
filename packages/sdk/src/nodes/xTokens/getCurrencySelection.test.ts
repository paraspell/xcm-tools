import { describe, it, expect, vi } from 'vitest'
import { getNode } from '../../utils'
import { getModifiedCurrencySelection } from './getModifiedCurrencySelection'
import { getCurrencySelection } from './getCurrencySelection'
import type { TCurrencySelectionHeader } from '../../types'
import { Parents, Version, type XTokensTransferInput } from '../../types'
import type ParachainNode from '../ParachainNode'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../../utils', () => ({
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
      amount: '1000',
      asset: {
        assetId: '123'
      },
      paraIdTo: 2000,
      overridedCurrencyMultiLocation: {
        parents: Parents.ZERO,
        interior: 'Here'
      }
    } as XTokensTransferInput<ApiPromise, Extrinsic>
    const currencySelection = '123'
    const isAssetHub = false

    vi.mocked(getNode).mockReturnValue({ version: Version.V4 } as ParachainNode<
      ApiPromise,
      Extrinsic
    >)

    const result = getCurrencySelection(input, isAssetHub, currencySelection)
    expect(result).toEqual({ V4: input.overridedCurrencyMultiLocation })
  })

  it('returns modified currency selection for asset hubs when no override is provided', () => {
    const input = {
      origin: 'Acala',
      amount: '2000',
      asset: {
        assetId: '123'
      },
      paraIdTo: 1000,
      overridedCurrencyMultiLocation: undefined
    } as XTokensTransferInput<ApiPromise, Extrinsic>
    const currencySelection = '123'
    const isAssetHub = true

    vi.mocked(getNode).mockReturnValue({ version: Version.V4 } as ParachainNode<
      ApiPromise,
      Extrinsic
    >)
    vi.mocked(getModifiedCurrencySelection).mockReturnValue(mockCurrencySelectionHeader)

    const result = getCurrencySelection(input, isAssetHub, currencySelection)
    expect(result).toEqual(mockCurrencySelectionHeader)
  })

  it('returns the unmodified currency selection when not an asset hub and no override provided', () => {
    const input = {
      origin: 'Acala',
      amount: '3000',
      asset: {
        assetId: '123'
      },
      paraIdTo: 3000,
      overridedCurrencyMultiLocation: undefined
    } as XTokensTransferInput<ApiPromise, Extrinsic>
    const currencySelection = '123'
    const isAssetHub = false

    vi.mocked(getNode).mockReturnValue({ version: Version.V4 } as ParachainNode<
      ApiPromise,
      Extrinsic
    >)

    const result = getCurrencySelection(input, isAssetHub, currencySelection)
    expect(result).toEqual(currencySelection)
  })
})
