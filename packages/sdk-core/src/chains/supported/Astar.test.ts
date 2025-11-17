import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AMOUNT_ALL } from '../../constants'
import { ChainNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { getChain } from '../../utils'
import type Astar from './Astar'

vi.mock('../../pallets/polkadotXcm')
vi.mock('../../pallets/xTokens')

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
    astar = getChain<unknown, unknown, 'Astar'>('Astar')
  })

  it('should initialize with correct values', () => {
    expect(astar.chain).toBe('Astar')
    expect(astar.info).toBe('astar')
    expect(astar.ecosystem).toBe('Polkadot')
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

  it('should throw ChainNotSupportedError when calling transferRelayToPara', () => {
    expect(() => astar.transferRelayToPara()).toThrow(ChainNotSupportedError)
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw an error when asset is not a foreign asset', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
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
        deserializeExtrinsics: vi.fn()
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
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      astar.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        params: {
          target: { Id: mockOptions.address },
          id: 1,
          amount: BigInt(mockOptions.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when amount is ALL', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: AMOUNT_ALL, assetId: '1' },
        address: 'address',
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      astar.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          dest: { Id: mockOptions.address },
          id: 1,
          keep_alive: false
        }
      })
    })
  })
})
