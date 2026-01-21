import {
  getNativeAssetSymbol,
  getOtherAssets,
  normalizeSymbol,
  type TAsset
} from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import { type TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
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

vi.mock('../../utils/location')
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
    beneficiaryLocation: {} as TLocation,
    paraIdTo: 1001,
    address: 'address',
    destination: 'Polkadot',
    senderAddress: '0x1234567890abcdef'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'AssetHubPolkadot'>('AssetHubPolkadot')
    vi.mocked(normalizeSymbol).mockImplementation(sym => (sym ?? '').toUpperCase())
    vi.mocked(transferPolkadotXcm).mockResolvedValue(mockExtrinsic)
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('AssetHubPolkadot')
    expect(chain.info).toBe('PolkadotAssetHub')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
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
        expect(handleExecuteTransfer).toHaveBeenCalledWith(input)
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
