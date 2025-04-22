import { InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import XTokensTransferImpl from '../../pallets/xTokens'
import type {
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Astar from './Astar'

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Astar', () => {
  let astar: Astar<unknown, unknown>
  const mockPolkadotXCMInput = {
    scenario: 'ParaToPara',
    asset: { symbol: 'DOT', amount: '100' }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  const mockXTokensInput = {
    asset: { assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    astar = getNode<unknown, unknown, 'Astar'>('Astar')
  })

  it('should initialize with correct values', () => {
    expect(astar.node).toBe('Astar')
    expect(astar.info).toBe('astar')
    expect(astar.type).toBe('polkadot')
    expect(astar.version).toBe(Version.V3)
  })

  it('should call transferPolkadotXCM with limitedReserveTransferAssets for ParaToPara scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await astar.transferPolkadotXCM(mockPolkadotXCMInput)

    expect(spy).toHaveBeenCalledWith(
      mockPolkadotXCMInput,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    astar.transferXTokens(mockXTokensInput)

    expect(spy).toHaveBeenCalledWith(mockXTokensInput, 123n)
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw an error when asset is not a foreign asset', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => astar.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error when assetId is undefined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => astar.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100', assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      astar.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Assets',
        section: 'transfer',
        parameters: {
          target: { Id: mockOptions.address },
          id: 1,
          amount: BigInt(mockOptions.asset.amount)
        }
      })
    })
  })
})
