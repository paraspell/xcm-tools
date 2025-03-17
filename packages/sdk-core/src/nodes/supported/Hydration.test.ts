import { hasJunction } from '@paraspell/sdk-common'
import { ethers } from 'ethers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import XTokensTransferImpl from '../../pallets/xTokens'
import type {
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TSerializedApiCall,
  TXTokensTransferOptions
} from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Hydration from './Hydration'
import { createTransferAssetsTransfer, createTypeAndThenTransfer } from './Polimec'

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

vi.mock('./Polimec', async importOriginal => ({
  ...(await importOriginal<typeof import('./Polimec')>()),
  createTypeAndThenTransfer: vi.fn(),
  createTransferAssetsTransfer: vi.fn()
}))

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal<typeof import('@paraspell/sdk-common')>()),
  hasJunction: vi.fn()
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
        callTxMethod: vi.fn().mockReturnValue('success'),
        createApiForNode: vi.fn().mockResolvedValue({
          getFromRpc: vi.fn().mockResolvedValue('0x0000000000000000'),
          disconnect: vi.fn()
        }),
        getFromRpc: vi.fn().mockResolvedValue('0x0000000000000000'),
        accountToHex: vi.fn().mockReturnValue('0x0000000000000000'),
        stringToUint8a: vi.fn().mockReturnValue(new Uint8Array(0)),
        hexToUint8a: vi.fn().mockReturnValue(new Uint8Array(0)),
        blake2AsHex: vi.fn().mockReturnValue('0x0000000000000000')
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
        destination: 'Ethereum'
      } as TPolkadotXCMTransferOptions<unknown, unknown>
    })

    it('should call api.callTxMethod with correct parameters', async () => {
      const spy = vi.spyOn(mockApi, 'callTxMethod')

      await hydration.transferPolkadotXCM({
        ...mockInput,
        senderAddress: '5Gw3s7q'
      })

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
        assetId: '1',
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

    it('should call api.callTxMethod using createTypeAndThenTransfer when asset is DOT', () => {
      mockInput = {
        api: mockApi,
        address: '0xPolimecAddress',
        asset: { symbol: 'DOT', assetId: '1', amount: '1000' },
        scenario: 'ParaToPara',
        destination: 'Polimec',
        version: Version.V3
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const typeAndThenCall = { dummy: 'call-dummy' } as unknown as TSerializedApiCall
      vi.mocked(createTypeAndThenTransfer).mockReturnValue(typeAndThenCall)
      const callTxSpy = vi.spyOn(mockApi, 'callTxMethod')

      const result = hydration.transferToPolimec(mockInput)

      expect(createTypeAndThenTransfer).toHaveBeenCalledWith(mockInput, Version.V3)
      expect(callTxSpy).toHaveBeenCalledWith(typeAndThenCall)
      expect(result).toBe('success')
    })

    it('should call createTransferAssetsTransfer for non-DOT asset (USDC) when junction is valid', () => {
      mockInput = {
        api: mockApi,
        address: '0xPolimecAddress',
        asset: { symbol: 'USDC', assetId: 'usdc-id', amount: '500', multiLocation: {} },
        scenario: 'ParaToPara',
        destination: 'Polimec',
        version: Version.V3
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const hasJunctionSpy = vi.mocked(hasJunction).mockReturnValue(true)

      const assetsTransferSpy = vi
        .mocked(createTransferAssetsTransfer)
        .mockReturnValue('assets-transfer-call')

      const result = hydration.transferToPolimec(mockInput)

      expect(hasJunctionSpy).toHaveBeenCalled()
      expect(assetsTransferSpy).toHaveBeenCalledWith(mockInput, Version.V3)
      expect(result).toBe('assets-transfer-call')

      hasJunctionSpy.mockRestore()
    })

    it('should throw InvalidCurrencyError for USDC when junction is invalid', () => {
      mockInput = {
        api: mockApi,
        address: '0xPolimecAddress',
        asset: { symbol: 'USDC', assetId: 'usdc-id', amount: '500', multiLocation: {} },
        scenario: 'ParaToPara',
        destination: 'Polimec',
        version: Version.V3
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const hasJunctionSpy = vi.mocked(hasJunction).mockReturnValue(false)

      expect(() => hydration.transferToPolimec(mockInput)).toThrowError(
        'The selected asset is not supported for transfer to Polimec'
      )

      hasJunctionSpy.mockRestore()
    })
  })

  describe('canUseXTokens', () => {
    it('should return false when destination is Ethereum', () => {
      const result = hydration['canUseXTokens']({ to: 'Ethereum' } as TSendInternalOptions<
        unknown,
        unknown
      >)
      expect(result).toBe(false)
    })

    it('should return true when destination is not Ethereum', () => {
      const result = hydration['canUseXTokens']({
        to: 'Acala'
      } as TSendInternalOptions<unknown, unknown>)
      expect(result).toBe(true)
    })

    it('should return false when destination AssetHubPolkadot and currency is DOT', () => {
      const result = hydration['canUseXTokens']({
        to: 'AssetHubPolkadot',
        asset: { symbol: 'DOT' }
      } as TSendInternalOptions<unknown, unknown>)
      expect(result).toBe(false)
    })
  })
})
