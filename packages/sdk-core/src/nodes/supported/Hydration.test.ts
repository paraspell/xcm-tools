import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ethers } from 'ethers'
import type {
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TXTokensTransferOptions
} from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../../pallets/xTokens'
import type Hydration from './Hydration'
import { getNode } from '../../utils'
import type { IPolkadotApi } from '../../api'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('Hydration', () => {
  let hydration: Hydration<unknown, unknown>

  beforeEach(() => {
    hydration = getNode<unknown, unknown, 'Hydration'>('Hydration')
  })

  it('should initialize with correct values', () => {
    expect(hydration.node).toBe('Hydration')
    expect(hydration.info).toBe('hydradx')
    expect(hydration.type).toBe('polkadot')
    expect(hydration.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const mockInput = {
      asset: { assetId: '123', amount: '100' }
    } as TXTokensTransferOptions<unknown, unknown>

    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    hydration.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, Number(123))
  })

  describe('transferPolkadotXCM', () => {
    let mockApi: IPolkadotApi<unknown, unknown>
    let mockInput: TPolkadotXCMTransferOptions<unknown, unknown>

    beforeEach(() => {
      mockApi = {
        callTxMethod: vi.fn().mockResolvedValue('success'),
        createApiForNode: vi.fn().mockResolvedValue({
          getFromStorage: vi.fn().mockResolvedValue('0x0000000000000000'),
          disconnect: vi.fn()
        }),
        createAccountId: vi.fn().mockReturnValue('0x0000000000000000')
      } as unknown as IPolkadotApi<unknown, unknown>

      mockInput = {
        api: mockApi,
        address: ethers.Wallet.createRandom().address,
        asset: {
          symbol: 'WETH',
          assetId: '0x1234567890abcdef',
          amount: '1000',
          multiLocation: {
            parents: 2,
            interior: {
              X2: [
                {
                  GlobalConsensus: {
                    Ethereum: {
                      chainId: 1
                    }
                  }
                },
                {
                  AccountKey20: {
                    network: null,
                    key: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
                  }
                }
              ]
            }
          }
        },
        scenario: 'RelayToPara',
        destination: 'Ethereum',
        ahAddress: '5Gw3s7q4QLkSWwknsiixu9GR7x6xN5PWQ1YbQGxwSz1Y7DZT'
      } as TPolkadotXCMTransferOptions<unknown, unknown>
    })

    it('should throw error if ahAddress is undefined', async () => {
      mockInput.ahAddress = undefined

      await expect(hydration.transferPolkadotXCM(mockInput)).rejects.toThrow(
        'AssetHub address is required for Ethereum transfers'
      )
    })

    it('should call api.callTxMethod with correct parameters', async () => {
      const spy = vi.spyOn(mockApi, 'callTxMethod')

      await hydration.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith({
        module: 'PolkadotXcm',
        section: 'transfer_assets_using_type_and_then',
        parameters: expect.any(Object)
      })
    })

    it('should create call for AssetHub destination DOT transfer using symbol', async () => {
      mockInput.destination = 'AssetHubPolkadot'
      mockInput.asset = {
        symbol: 'DOT',
        amount: '1000'
      }

      const transferToAhSpy = vi.spyOn(hydration, 'transferToAssetHub')
      const spy = vi.spyOn(mockApi, 'callTxMethod')

      await hydration.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalled()
      expect(transferToAhSpy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith({
        module: 'PolkadotXcm',
        section: 'transfer_assets_using_type_and_then',
        parameters: expect.any(Object)
      })
    })

    it('should create call for AssetHub destination DOT transfer using assetId', async () => {
      mockInput.destination = 'AssetHubPolkadot'
      mockInput.asset = { symbol: 'DOT', assetId: '3', amount: '1000' }

      const transferToAhSpy = vi.spyOn(hydration, 'transferToAssetHub')
      const spy = vi.spyOn(mockApi, 'callTxMethod')

      await hydration.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalled()
      expect(transferToAhSpy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith({
        module: 'PolkadotXcm',
        section: 'transfer_assets_using_type_and_then',
        parameters: expect.any(Object)
      })
    })
  })

  describe('canUseXTokens', () => {
    it('should return false when destination is Ethereum', () => {
      const result = hydration['canUseXTokens']({ destination: 'Ethereum' } as TSendInternalOptions<
        unknown,
        unknown
      >)
      expect(result).toBe(false)
    })

    it('should return true when destination is not Ethereum', () => {
      const result = hydration['canUseXTokens']({
        destination: 'Acala'
      } as TSendInternalOptions<unknown, unknown>)
      expect(result).toBe(true)
    })

    it('should return false when destination AssetHubPolkadot and currency is DOT', () => {
      const result = hydration['canUseXTokens']({
        destination: 'AssetHubPolkadot',
        asset: { symbol: 'DOT' }
      } as TSendInternalOptions<unknown, unknown>)
      expect(result).toBe(false)
    })
  })
})
