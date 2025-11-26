import {
  getNativeAssetSymbol,
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset,
  normalizeSymbol,
  type TAsset,
  type TNativeAssetInfo,
  type WithAmount
} from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import { type TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { AMOUNT_ALL, DOT_LOCATION } from '../../constants'
import { BridgeHaltedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { getBridgeStatus } from '../../transfer/getBridgeStatus'
import type { TTransferLocalOptions } from '../../types'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import { handleExecuteTransfer } from '../../utils/transfer'
import type AssetHubPolkadot from './AssetHubPolkadot'

vi.mock('@paraspell/assets', async importActual => ({
  ...(await importActual()),
  getOtherAssets: vi.fn(),
  getParaId: vi.fn(),
  InvalidCurrencyError: class extends Error {},
  isForeignAsset: vi.fn(),
  hasSupportForAsset: vi.fn(),
  findAssetInfoByLoc: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  normalizeSymbol: vi.fn(),
  isAssetEqual: vi.fn()
}))

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal()),
  hasJunction: vi.fn()
}))

vi.mock('../../transfer/getBridgeStatus')
vi.mock('../../utils/location')
vi.mock('../../utils/ethereum/generateMessageId')
vi.mock('../../pallets/xcmPallet/utils')
vi.mock('../../pallets/polkadotXcm')
vi.mock('../../transfer')
vi.mock('../../utils/transfer')

describe('AssetHubPolkadot', () => {
  let assetHub: AssetHubPolkadot<unknown, unknown>

  const mockApi = {
    deserializeExtrinsics: vi.fn(),
    getXcmWeight: vi.fn(),
    createApiForChain: vi.fn().mockResolvedValue({
      getFromStorage: vi.fn().mockResolvedValue('0x0000000000000000')
    }),
    createAccountId: vi.fn().mockReturnValue('0x0000000000000000'),
    clone: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockExtrinsic = {} as unknown

  const mockInput = {
    api: mockApi,
    assetInfo: { symbol: 'DOT', amount: 1000n, isNative: true },
    asset: {} as TAsset,
    scenario: 'ParaToRelay',
    destLocation: {} as TLocation,
    beneficiaryLocation: {} as TLocation,
    paraIdTo: 1001,
    address: 'address',
    destination: 'Polkadot',
    senderAddress: '0x1234567890abcdef'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    assetHub = getChain<unknown, unknown, 'AssetHubPolkadot'>('AssetHubPolkadot')
    vi.mocked(getBridgeStatus).mockResolvedValue('Normal')
    vi.mocked(normalizeSymbol).mockImplementation(sym => (sym ?? '').toUpperCase())
    vi.mocked(transferPolkadotXcm).mockResolvedValue(mockExtrinsic)
  })

  it('should initialize with correct values', () => {
    expect(assetHub.chain).toBe('AssetHubPolkadot')
    expect(assetHub.info).toBe('PolkadotAssetHub')
    expect(assetHub.ecosystem).toBe('Polkadot')
    expect(assetHub.version).toBe(Version.V5)
  })

  describe('handleEthBridgeTransfer', () => {
    it('should throw InvalidCurrencyError if currency is not supported for Ethereum transfers', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([])

      await expect(assetHub.handleEthBridgeTransfer(mockInput)).rejects.toThrowError(
        InvalidCurrencyError
      )
    })

    it('should throw BridgeHaltedError if bridge status is not normal', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'ETH', decimals: 18, assetId: '0x123' }])
      vi.mocked(isForeignAsset).mockReturnValue(true)

      vi.mocked(getBridgeStatus).mockResolvedValue('Halted')

      await expect(assetHub.handleEthBridgeTransfer(mockInput)).rejects.toThrowError(
        BridgeHaltedError
      )
    })

    it('should process a valid ETH transfer', async () => {
      const mockEthAsset = { symbol: 'ETH', decimals: 18, assetId: '0x123' }
      vi.mocked(getOtherAssets).mockReturnValue([mockEthAsset])
      vi.mocked(isForeignAsset).mockReturnValue(true)

      const input = {
        ...mockInput,
        assetInfo: { symbol: 'ETH', assetId: '0x123', location: {} },
        destination: 'Ethereum'
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      const result = await assetHub.handleEthBridgeTransfer(input)

      expect(result).toStrictEqual(mockExtrinsic)
      expect(transferPolkadotXcm).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleEthBridgeNativeTransfer', () => {
    it('should throw if the address is location', async () => {
      const input = {
        ...mockInput,
        address: DOT_LOCATION
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      await expect(assetHub.handleEthBridgeNativeTransfer(input)).rejects.toThrow(
        'Location address is not supported for Ethereum transfers'
      )
    })

    it('should throw InvalidCurrencyError if currency is not supported for Ethereum transfers', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([])

      await expect(assetHub.handleEthBridgeNativeTransfer(mockInput)).rejects.toThrowError(
        InvalidCurrencyError
      )
    })

    it('should throw BridgeHaltedError if bridge status is not normal', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'ETH', decimals: 18, assetId: '0x123' }])
      vi.mocked(isForeignAsset).mockReturnValue(true)

      vi.mocked(getBridgeStatus).mockResolvedValue('Halted')

      await expect(assetHub.handleEthBridgeNativeTransfer(mockInput)).rejects.toThrowError(
        BridgeHaltedError
      )
    })

    it('should process a valid AH native asset to ETH transfer', async () => {
      const mockEthAsset = { symbol: 'ETH', decimals: 18, assetId: '0x123' }
      vi.mocked(getOtherAssets).mockReturnValue([mockEthAsset])
      vi.mocked(isForeignAsset).mockReturnValue(true)

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics').mockResolvedValue('success')

      const input = {
        ...mockInput,
        assetInfo: { symbol: 'ETH', assetId: '0x123', location: {} },
        destination: 'Ethereum'
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const result = await assetHub.handleEthBridgeNativeTransfer(input)

      expect(result).toEqual('success')
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleMythosTransfer', () => {
    it('should process a valid Mythos transfer', async () => {
      const input = {
        ...mockInput,
        destination: 'Mythos',
        paraIdTo: 2000
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      const result = await assetHub.handleMythosTransfer(input)

      expect(result).toStrictEqual(mockExtrinsic)
      expect(transferPolkadotXcm).toHaveBeenCalledTimes(1)
    })
  })

  describe('transferPolkadotXcm', () => {
    it('should process a valid transfer for non-ParaToPara scenario', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'DOT', decimals: 10, assetId: '' }])

      const input = {
        ...mockInput,
        scenario: 'RelayToPara'
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const result = await assetHub.transferPolkadotXCM(input)
      expect(result).toStrictEqual(mockExtrinsic)
      expect(transferPolkadotXcm).toHaveBeenCalledTimes(1)
    })

    describe('with feeAsset provided', () => {
      beforeEach(() => {
        vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
        vi.mocked(handleExecuteTransfer).mockResolvedValue({
          module: 'System' as TPallet,
          method: 'remark',
          params: { _remark: '0x' }
        })
        vi.spyOn(mockApi, 'deserializeExtrinsics').mockResolvedValue(mockExtrinsic)
      })

      it.each([
        { assetSymbol: 'USDT', feeAssetSymbol: 'DOT', description: 'asset is non-native' },
        { assetSymbol: 'DOT', feeAssetSymbol: 'USDT', description: 'feeAsset is non-native' },
        { assetSymbol: 'USDC', feeAssetSymbol: 'USDT', description: 'both are non-native' }
      ])(
        'should call handleExecuteTransfer when $description',
        async ({ assetSymbol, feeAssetSymbol }) => {
          const input = {
            ...mockInput,
            assetInfo: { symbol: assetSymbol, amount: 100n },
            feeAssetInfo: { symbol: feeAssetSymbol }
          } as TPolkadotXCMTransferOptions<unknown, unknown>
          const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')
          await assetHub.transferPolkadotXCM(input)
          expect(handleExecuteTransfer).toHaveBeenCalledWith('AssetHubPolkadot', input)
          expect(spy).toHaveBeenCalledTimes(1)
        }
      )

      it('should not call handleExecuteTransfer when both asset and feeAsset are native', async () => {
        const input = {
          ...mockInput,
          destination: 'Acala',
          assetInfo: { symbol: 'DOT', amount: 100n },
          feeAssetInfo: { symbol: 'DOT' }
        } as TPolkadotXCMTransferOptions<unknown, unknown>
        await assetHub.transferPolkadotXCM(input)
        expect(handleExecuteTransfer).not.toHaveBeenCalled()
        expect(transferPolkadotXcm).toHaveBeenCalled()
      })
    })

    it('should call handleEthBridgeTransfer when destination is Ethereum', async () => {
      mockInput.destination = 'Ethereum'

      const spy = vi.spyOn(assetHub, 'handleEthBridgeTransfer').mockResolvedValue({} as unknown)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalledWith(mockInput)
    })

    it('should call handleMythosTransfer when destination is Mythos', async () => {
      mockInput.destination = 'Mythos'

      const handleMythosTransferSpy = vi
        .spyOn(assetHub, 'handleMythosTransfer')
        .mockResolvedValue({} as unknown)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(handleMythosTransferSpy).toHaveBeenCalledWith(mockInput)
    })

    it('should modify input for USDT currencySymbol', async () => {
      mockInput.assetInfo = {
        symbol: 'USDT',
        amount: 1000n,
        location: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 1000
            }
          }
        },
        isNative: true
      } as WithAmount<TNativeAssetInfo>
      mockInput.scenario = 'ParaToPara'
      mockInput.destination = 'BifrostPolkadot'

      await assetHub.transferPolkadotXCM(mockInput)

      expect(transferPolkadotXcm).toHaveBeenCalled()
    })

    it('should modify input for USDC currencyId', async () => {
      mockInput.assetInfo = {
        symbol: 'USDC',
        decimals: 6,
        location: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 1000
            }
          }
        } as TLocation,
        amount: 1000n
      }
      mockInput.scenario = 'ParaToPara'
      mockInput.destination = 'BifrostPolkadot'

      await assetHub.transferPolkadotXCM(mockInput)

      expect(transferPolkadotXcm).toHaveBeenCalled()
    })

    it('should modify input for DOT transfer to Hydration', async () => {
      mockInput.destination = 'Hydration'
      mockInput.assetInfo = {
        symbol: 'DOT',
        amount: 1000n,
        isNative: true
      } as WithAmount<TNativeAssetInfo>

      vi.mocked(getOtherAssets).mockImplementation(chain =>
        chain === 'Ethereum' ? [] : [{ symbol: 'DOT', decimals: 10, assetId: '' }]
      )

      await assetHub.transferPolkadotXCM(mockInput)

      expect(transferPolkadotXcm).toHaveBeenCalled()
    })
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = assetHub.getRelayToParaOverrides()
    expect(result).toEqual({
      transferType: 'teleport'
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw error if asset is not a foreign asset', () => {
      const input = {
        ...mockInput,
        assetInfo: { symbol: 'DOT', amount: 1000n, isNative: true } as WithAmount<TNativeAssetInfo>,
        scenario: 'RelayToPara',
        destination: 'Acala',
        to: 'AssetHubPolkadot'
      } as unknown as TTransferLocalOptions<unknown, unknown>
      vi.mocked(isForeignAsset).mockReturnValueOnce(false)

      expect(() => assetHub.transferLocalNonNativeAsset(input)).toThrow(InvalidCurrencyError)
    })

    it('should call api.deserializeExtrinsics with correct parameters if assetId is defined', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: 1000n },
        address: '0x1234567890abcdef'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValueOnce(true)

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      assetHub.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        params: {
          id: 123,
          target: { Id: mockInput.address },
          amount: BigInt(mockInput.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when assetId is defined and amount is ALL', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: AMOUNT_ALL },
        address: '0x1234567890abcdef',
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValueOnce(true)

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      assetHub.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: 123,
          dest: { Id: mockInput.address },
          keep_alive: false
        }
      })
    })

    it('should call api.deserializeExtrinsics with correct parameters if assetId is not defined', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', amount: 1000n, location: {} },
        address: '0x1234567890abcdef'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValueOnce(true)

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      assetHub.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'ForeignAssets',
        method: 'transfer',
        params: {
          id: {},
          target: { Id: mockInput.address },
          amount: BigInt(mockInput.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when assetId is undefined and amount is ALL', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', amount: AMOUNT_ALL, location: {} },
        address: '0x1234567890abcdef',
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValueOnce(true)

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      assetHub.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'ForeignAssets',
        method: 'transfer_all',
        params: {
          id: {},
          dest: { Id: mockInput.address },
          keep_alive: false
        }
      })
    })
  })
})
