import {
  getNativeAssetSymbol,
  getOtherAssets,
  InvalidCurrencyError,
  normalizeSymbol,
  type TAsset
} from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import { type TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
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
  let chain: AssetHubPolkadot<unknown, unknown>

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
    chain = getChain<unknown, unknown, 'AssetHubPolkadot'>('AssetHubPolkadot')
    vi.mocked(getBridgeStatus).mockResolvedValue('Normal')
    vi.mocked(normalizeSymbol).mockImplementation(sym => (sym ?? '').toUpperCase())
    vi.mocked(transferPolkadotXcm).mockResolvedValue(mockExtrinsic)
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('AssetHubPolkadot')
    expect(chain.info).toBe('PolkadotAssetHub')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  describe('handleEthBridgeTransfer', () => {
    it('should throw InvalidCurrencyError if currency is not supported for Ethereum transfers', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([])

      await expect(chain.handleEthBridgeTransfer(mockInput)).rejects.toThrow(InvalidCurrencyError)
    })

    it('should throw BridgeHaltedError if bridge status is not normal', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'ETH', decimals: 18, assetId: '0x123' }])

      vi.mocked(getBridgeStatus).mockResolvedValue('Halted')

      await expect(chain.handleEthBridgeTransfer(mockInput)).rejects.toThrow(BridgeHaltedError)
    })

    it('should process a valid ETH transfer', async () => {
      const mockEthAsset = { symbol: 'ETH', decimals: 18, assetId: '0x123' }
      vi.mocked(getOtherAssets).mockReturnValue([mockEthAsset])

      const input = {
        ...mockInput,
        assetInfo: { symbol: 'ETH', assetId: '0x123', location: {} },
        destination: 'Ethereum'
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      const result = await chain.handleEthBridgeTransfer(input)

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

      await expect(chain.handleEthBridgeNativeTransfer(input)).rejects.toThrow(
        'Location address is not supported for Ethereum transfers'
      )
    })

    it('should throw InvalidCurrencyError if currency is not supported for Ethereum transfers', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([])

      await expect(chain.handleEthBridgeNativeTransfer(mockInput)).rejects.toThrow(
        InvalidCurrencyError
      )
    })

    it('should throw BridgeHaltedError if bridge status is not normal', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'ETH', decimals: 18, assetId: '0x123' }])

      vi.mocked(getBridgeStatus).mockResolvedValue('Halted')

      await expect(chain.handleEthBridgeNativeTransfer(mockInput)).rejects.toThrow(
        BridgeHaltedError
      )
    })

    it('should process a valid AH native asset to ETH transfer', async () => {
      const mockEthAsset = { symbol: 'ETH', decimals: 18, assetId: '0x123' }
      vi.mocked(getOtherAssets).mockReturnValue([mockEthAsset])

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics').mockResolvedValue('success')

      const input = {
        ...mockInput,
        assetInfo: { symbol: 'ETH', assetId: '0x123', location: {} },
        destination: 'Ethereum'
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const result = await chain.handleEthBridgeNativeTransfer(input)

      expect(result).toEqual('success')
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('transferPolkadotXcm', () => {
    it('should process a valid transfer for non-ParaToPara scenario', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'DOT', decimals: 10, assetId: '' }])

      const input = {
        ...mockInput,
        scenario: 'RelayToPara'
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const result = await chain.transferPolkadotXCM(input)
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
        { assetSymbol: 'USDT', feeAssetSymbol: 'DOT' },
        { assetSymbol: 'DOT', feeAssetSymbol: 'USDT' },
        { assetSymbol: 'USDC', feeAssetSymbol: 'USDT' }
      ])('should call handleExecuteTransfer ', async ({ assetSymbol, feeAssetSymbol }) => {
        const input = {
          ...mockInput,
          assetInfo: { symbol: assetSymbol, amount: 100n },
          feeAssetInfo: { symbol: feeAssetSymbol }
        } as TPolkadotXCMTransferOptions<unknown, unknown>
        const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')
        await chain.transferPolkadotXCM(input)
        expect(handleExecuteTransfer).toHaveBeenCalledWith('AssetHubPolkadot', input)
        expect(spy).toHaveBeenCalledTimes(1)
      })

      it('should not call handleExecuteTransfer when both asset and feeAsset are native', async () => {
        const input = {
          ...mockInput,
          destination: 'Acala',
          assetInfo: { symbol: 'DOT', amount: 100n },
          feeAssetInfo: { symbol: 'DOT' }
        } as TPolkadotXCMTransferOptions<unknown, unknown>
        await chain.transferPolkadotXCM(input)
        expect(handleExecuteTransfer).not.toHaveBeenCalled()
        expect(transferPolkadotXcm).toHaveBeenCalled()
      })
    })

    it('should call handleEthBridgeTransfer when destination is Ethereum', async () => {
      mockInput.destination = 'Ethereum'

      const spy = vi.spyOn(chain, 'handleEthBridgeTransfer').mockResolvedValue({} as unknown)

      await chain.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalledWith(mockInput)
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should call api.deserializeExtrinsics with correct parameters if assetId is defined', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: 1000n },
        address: '0x1234567890abcdef'
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockInput)

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
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: 100n },
        address: '0x1234567890abcdef',
        isAmountAll: true
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockInput)

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
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', amount: 1000n, location: {} },
        address: '0x1234567890abcdef'
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockInput)

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
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', amount: 100n, location: {} },
        address: '0x1234567890abcdef',
        isAmountAll: true
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockInput)

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
