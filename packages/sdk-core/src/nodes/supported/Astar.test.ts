import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { getNode } from '../../utils'
import type Astar from './Astar'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

describe('Astar', () => {
  let astar: Astar<unknown, unknown>
  const mockPolkadotXCMInput = {
    scenario: 'ParaToPara',
    assetInfo: { symbol: 'DOT', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  const mockXTokensInput = {
    asset: { assetId: '123', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    astar = getNode<unknown, unknown, 'Astar'>('Astar')
  })

  it('should initialize with correct values', () => {
    expect(astar.node).toBe('Astar')
    expect(astar.info).toBe('astar')
    expect(astar.type).toBe('polkadot')
    expect(astar.version).toBe(Version.V5)
  })

  it('should call transferPolkadotXCM with limitedReserveTransferAssets for ParaToPara scenario', async () => {
    await astar.transferPolkadotXCM(mockPolkadotXCMInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockPolkadotXCMInput,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('should call transferXTokens with currencyID', () => {
    astar.transferXTokens(mockXTokensInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockXTokensInput, 123n)
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
        asset: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      astar.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        parameters: {
          target: { Id: mockOptions.address },
          id: 1,
          amount: BigInt(mockOptions.asset.amount)
        }
      })
    })
  })
})
