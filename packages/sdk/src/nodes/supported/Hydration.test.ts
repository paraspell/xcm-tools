import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ethers } from 'ethers'
import type {
  PolkadotXCMTransferInput,
  TSendInternalOptions,
  XTokensTransferInput
} from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Hydration from './Hydration'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic, TPjsApi } from '../../pjs/types'
import { InvalidCurrencyError } from '../../errors'
import type { IPolkadotApi } from '../../api'

vi.mock('../xTokens', () => ({
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
  let hydration: Hydration<ApiPromise, Extrinsic>

  beforeEach(() => {
    hydration = getNode<ApiPromise, Extrinsic, 'Hydration'>('Hydration')
  })

  it('should initialize with correct values', () => {
    expect(hydration.node).toBe('Hydration')
    expect(hydration.info).toBe('hydradx')
    expect(hydration.type).toBe('polkadot')
    expect(hydration.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const mockInput = {
      asset: { assetId: '123' },
      amount: '100'
    } as XTokensTransferInput<TPjsApi, Extrinsic>

    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    hydration.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, Number(123))
  })

  describe('transferPolkadotXCM', () => {
    let mockApi: IPolkadotApi<TPjsApi, Extrinsic>
    let mockInput: PolkadotXCMTransferInput<ApiPromise, Extrinsic>

    beforeEach(() => {
      mockApi = {
        callTxMethod: vi.fn().mockResolvedValue('success'),
        createApiForNode: vi.fn().mockResolvedValue({
          getFromStorage: vi.fn().mockResolvedValue('0x0000000000000000')
        }),
        createAccountId: vi.fn().mockReturnValue('0x0000000000000000')
      } as unknown as IPolkadotApi<TPjsApi, Extrinsic>

      mockInput = {
        api: mockApi,
        address: ethers.Wallet.createRandom().address,
        asset: { symbol: 'WETH', assetId: '0x1234567890abcdef' },
        scenario: 'RelayToPara',
        destination: 'Ethereum',
        amount: '1000',
        ahAddress: '5Gw3s7q4QLkSWwknsiixu9GR7x6xN5PWQ1YbQGxwSz1Y7DZT'
      } as PolkadotXCMTransferInput<TPjsApi, Extrinsic>
    })

    it('should throw error for non-Ethereum address', async () => {
      mockInput.address = 'invalidAddress'

      await expect(hydration.transferPolkadotXCM(mockInput)).rejects.toThrow(
        'Only Ethereum addresses are supported for Ethereum transfers'
      )
    })

    it('should throw InvalidCurrencyError for unsupported currency', async () => {
      mockInput.asset.symbol = 'DOT'

      await expect(hydration.transferPolkadotXCM(mockInput)).rejects.toThrow(InvalidCurrencyError)
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

    it('should create call for AssetHub destination DOT transfer', async () => {
      mockInput.destination = 'AssetHubPolkadot'
      mockInput.asset = {
        symbol: 'DOT'
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

    it('should create call for AssetHub destination DOT transfer', async () => {
      mockInput.destination = 'AssetHubPolkadot'
      mockInput.asset = { symbol: 'DOT', assetId: '3' }

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
        TPjsApi,
        Extrinsic
      >)
      expect(result).toBe(false)
    })

    it('should return true when destination is not Ethereum', () => {
      const result = hydration['canUseXTokens']({
        destination: 'Acala'
      } as TSendInternalOptions<TPjsApi, Extrinsic>)
      expect(result).toBe(true)
    })

    it('should return false when destination AssetHubPolkadot and currency is DOT', () => {
      const result = hydration['canUseXTokens']({
        destination: 'AssetHubPolkadot',
        asset: { symbol: 'DOT' }
      } as TSendInternalOptions<TPjsApi, Extrinsic>)
      expect(result).toBe(false)
    })
  })

  describe('getProvider', () => {
    it('should return LiebiEU provider', () => {
      expect(hydration.getProvider()).toBe('wss://rpc.hydradx.cloud')
    })
  })
})
