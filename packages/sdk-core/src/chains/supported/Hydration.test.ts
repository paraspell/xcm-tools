import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { findAssetInfoByLoc, findAssetInfoOrThrow, InvalidCurrencyError } from '@paraspell/assets'
import { hasJunction, Version } from '@paraspell/sdk-common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { AMOUNT_ALL } from '../../constants'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { getChain } from '../../utils'
import { getParaId } from '../config'
import Parachain from '../Parachain'
import type Hydration from './Hydration'

vi.mock('../../transfer/getBridgeStatus', () => ({
  getBridgeStatus: vi.fn().mockResolvedValue('Normal')
}))

vi.mock('../../pallets/xTokens')

vi.mock('../../pallets/polkadotXcm')

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal<typeof import('@paraspell/sdk-common')>()),
  hasJunction: vi.fn()
}))

vi.mock('@paraspell/assets', async importOriginal => ({
  ...(await importOriginal<typeof import('@paraspell/sdk-common')>()),
  findAssetInfoByLoc: vi.fn(),
  findAssetInfoOrThrow: vi.fn()
}))

describe('Hydration', () => {
  let hydration: Hydration<unknown, unknown>

  const mockExtrinsic = {} as unknown

  beforeEach(() => {
    vi.clearAllMocks()
    hydration = getChain<unknown, unknown, 'Hydration'>('Hydration')
    vi.mocked(transferPolkadotXcm).mockResolvedValue(mockExtrinsic)
  })

  it('should initialize with correct values', () => {
    expect(hydration.chain).toBe('Hydration')
    expect(hydration.info).toBe('hydradx')
    expect(hydration.ecosystem).toBe('Polkadot')
    expect(hydration.version).toBe(Version.V4)
  })

  it('should call transferXTokens with currencyID', () => {
    const mockInput = {
      asset: { assetId: '123', amount: 100n }
    } as TXTokensTransferOptions<unknown, unknown>

    hydration.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, Number(123))
  })

  describe('transferPolkadotXCM', () => {
    let mockApi: IPolkadotApi<unknown, unknown>
    let mockInput: TPolkadotXCMTransferOptions<unknown, unknown>

    beforeEach(() => {
      mockApi = {
        deserializeExtrinsics: vi.fn().mockReturnValue(mockExtrinsic),
        createApiForChain: vi.fn().mockResolvedValue({
          getFromRpc: vi.fn().mockResolvedValue('0x0000000000000000'),
          disconnect: vi.fn()
        }),
        getFromRpc: vi.fn().mockResolvedValue('0x0000000000000000'),
        accountToHex: vi.fn().mockReturnValue('0x0000000000000000'),
        stringToUint8a: vi.fn().mockReturnValue(new Uint8Array(0)),
        hexToUint8a: vi.fn().mockReturnValue(new Uint8Array(0)),
        blake2AsHex: vi.fn().mockReturnValue('0x0000000000000000'),
        clone: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      mockInput = {
        api: mockApi,
        address: '0xPolkadotAddress',
        assetInfo: {
          symbol: 'WETH',
          assetId: '0x1234567890abcdef',
          amount: 1000n,
          location: {
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

      vi.mocked(findAssetInfoByLoc).mockReturnValue(undefined)
    })

    it('should call api.deserializeExtrinsics with correct parameters', async () => {
      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      vi.mocked(findAssetInfoByLoc).mockReturnValue({
        assetId: '0x1234567890abcdef',
        symbol: 'WETH',
        decimals: 18
      })

      await hydration.transferPolkadotXCM({
        ...mockInput,
        senderAddress: '5Gw3s7q'
      })

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith({
        module: 'PolkadotXcm',
        method: 'transfer_assets_using_type_and_then',
        params: expect.any(Object)
      })
    })

    it('should call transferMoonbeamWhAsset for Moonbeam Wormhole asset', () => {
      const mockInput = {
        asset: {
          symbol: 'WORM',
          amount: 500n,
          location: {
            parents: 1,
            interior: {
              X2: [{ Parachain: getParaId('Moonbeam') }, { PalletInstance: 110 }]
            }
          },
          assetId: '999'
        },
        destination: 'Moonbeam',
        version: hydration.version
      } as TXTokensTransferOptions<unknown, unknown>

      vi.mocked(hasJunction).mockReturnValueOnce(true).mockReturnValueOnce(true)

      const transferMoonbeamWhAssetSpy = vi
        .spyOn(hydration, 'transferMoonbeamWhAsset')
        .mockReturnValue('moonbeam-wh-result')

      const result = hydration.transferXTokens(mockInput)

      expect(transferMoonbeamWhAssetSpy).toHaveBeenCalledWith(mockInput)
      expect(result).toBe('moonbeam-wh-result')
    })

    it('transferMoonbeamWhAsset should call transferXTokens with overridden fee + asset', () => {
      const mockAsset = {
        symbol: 'WORM',
        amount: 500n,
        location: {},
        assetId: '123'
      }

      const mockGlmrAsset = {
        symbol: 'GLMR',
        location: { parents: 1, interior: 'Here' }
      } as WithAmount<TAssetInfo>

      vi.mocked(findAssetInfoOrThrow).mockReturnValue(mockGlmrAsset)

      const mockInput = {
        asset: mockAsset
      } as TXTokensTransferOptions<unknown, unknown>

      hydration.transferMoonbeamWhAsset(mockInput)

      expect(transferXTokens).toHaveBeenCalledWith(
        expect.objectContaining({
          overriddenAsset: expect.arrayContaining([expect.anything(), expect.anything()])
        }),
        Number(mockAsset.assetId)
      )
    })
  })

  describe('canUseXTokens', () => {
    beforeEach(() => {
      vi.spyOn(Parachain.prototype, 'canUseXTokens').mockReturnValue(true)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should return false when destination is Ethereum', () => {
      const result = hydration['canUseXTokens']({
        to: 'Ethereum',
        assetInfo: { location: {} }
      } as TSendInternalOptions<unknown, unknown>)
      expect(result).toBe(false)
    })

    it('should return true when destination is not Ethereum', () => {
      const result = hydration['canUseXTokens']({
        to: 'Acala',
        assetInfo: { location: {} }
      } as TSendInternalOptions<unknown, unknown>)
      expect(result).toBe(true)
    })

    it('should return false when destination AssetHubPolkadot and currency is DOT', () => {
      const result = hydration['canUseXTokens']({
        to: 'AssetHubPolkadot',
        assetInfo: { symbol: 'DOT', location: {} }
      } as TSendInternalOptions<unknown, unknown>)
      expect(result).toBe(false)
    })

    it('should return false when super.canUseXTokens returns false', () => {
      vi.spyOn(Parachain.prototype, 'canUseXTokens').mockReturnValue(false)

      const result = hydration['canUseXTokens']({
        to: 'Acala',
        assetInfo: { symbol: 'USDC', location: {} }
      } as TSendInternalOptions<unknown, unknown>)

      expect(result).toBe(false)
    })
  })

  describe('transferLocalNativeAsset', () => {
    it('should call api.deserializeExtrinsics with correct parameters', async () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'DOT', amount: 1000n },
        address: '0x1234567890abcdef',
        balance: 2000n
      } as unknown as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      await hydration.transferLocalNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_keep_alive',
        params: {
          dest: mockInput.address,
          value: BigInt(mockInput.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when amount is ALL', async () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'DOT', amount: AMOUNT_ALL },
        address: '0x1234567890abcdef',
        balance: 2000n,
        senderAddress: 'sender',
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      await hydration.transferLocalNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_all',
        params: {
          dest: mockInput.address,
          keep_alive: false
        }
      })
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw InvalidCurrencyError if asset is not a foreign asset', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        asset: { symbol: 'DOT', amount: '1000' },
        address: '0x1234567890abcdef'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => hydration.transferLocalNonNativeAsset(mockInput)).toThrow(InvalidCurrencyError)
    })

    it('should throw InvalidCurrencyError if assetId is undefined', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        asset: { symbol: 'USDC', amount: '1000' },
        address: '0x1234567890abcdef'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => hydration.transferLocalNonNativeAsset(mockInput)).toThrow(InvalidCurrencyError)
    })

    it('should call api.deserializeExtrinsics with correct parameters', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: 1000n },
        address: '0x1234567890abcdef'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      hydration.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        params: {
          dest: mockInput.address,
          currency_id: 123,
          amount: BigInt(mockInput.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when amount is ALL', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: AMOUNT_ALL },
        address: '0x1234567890abcdef',
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      hydration.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest: mockInput.address,
          currency_id: 123,
          keep_alive: false
        }
      })
    })
  })
})
