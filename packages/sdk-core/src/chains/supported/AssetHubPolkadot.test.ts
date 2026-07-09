import {
  getOtherAssets,
  isAssetEqual,
  normalizeSymbol,
  type TAsset,
  type TAssetInfo
} from '@paraspell/assets'
import { type TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
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
  findAssetInfoByLoc: vi.fn(),
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
  let chain: AssetHubPolkadot<unknown, unknown, unknown>

  const mockApi = {
    deserializeExtrinsics: vi.fn(),
    getXcmWeight: vi.fn(),
    createApiForChain: vi.fn().mockResolvedValue({
      getFromStorage: vi.fn().mockResolvedValue('0x0000000000000000')
    }),
    createAccountId: vi.fn().mockReturnValue('0x0000000000000000'),
    findNativeAssetInfoOrThrow: vi.fn(),
    clone: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const mockExtrinsic = {} as unknown

  const mockInput = {
    api: mockApi,
    assetInfo: { symbol: 'DOT', amount: 1000n, isNative: true },
    asset: {} as TAsset,
    scenario: 'ParaToRelay',
    beneficiaryLocation: {} as TLocation,
    paraIdTo: 1001,
    sender: '0x1234567890abcdef',
    recipient: 'address',
    destination: 'Polkadot'
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'AssetHubPolkadot'>('AssetHubPolkadot')
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
      vi.mocked(getOtherAssets).mockReturnValue([
        {
          symbol: 'DOT',
          decimals: 10,
          assetId: '',
          location: {
            parents: 1,
            interior: 'Here'
          }
        }
      ])

      const input = {
        ...mockInput,
        scenario: 'RelayToPara'
      } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

      const result = await chain.transferPolkadotXCM(input)
      expect(result).toStrictEqual(mockExtrinsic)
      expect(transferPolkadotXcm).toHaveBeenCalledTimes(1)
    })

    describe('with feeAsset provided', () => {
      const DOT_LOC = { parents: 1, interior: 'Here' }
      const USDT_LOC = {
        parents: 1,
        interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }] }
      }
      const USDC_LOC = {
        parents: 1,
        interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1337 }] }
      }

      beforeEach(() => {
        vi.spyOn(mockApi, 'findNativeAssetInfoOrThrow').mockReturnValue({
          symbol: 'DOT',
          location: DOT_LOC
        } as TAssetInfo)
        vi.mocked(isAssetEqual).mockImplementation(
          (a, b) => JSON.stringify(a?.location) === JSON.stringify(b?.location)
        )
        vi.mocked(handleExecuteTransfer).mockResolvedValue({
          module: 'System',
          method: 'remark',
          params: { _remark: '0x' }
        })
        vi.spyOn(mockApi, 'deserializeExtrinsics').mockResolvedValue(mockExtrinsic)
      })

      it.each([
        { label: 'non-native asset, native fee', assetLoc: USDT_LOC, feeLoc: DOT_LOC },
        { label: 'native asset, non-native fee', assetLoc: DOT_LOC, feeLoc: USDT_LOC },
        { label: 'both non-native', assetLoc: USDC_LOC, feeLoc: USDT_LOC }
      ])('should call handleExecuteTransfer for $label', async ({ assetLoc, feeLoc }) => {
        const input = {
          ...mockInput,
          assetInfo: { symbol: 'A', amount: 100n, location: assetLoc },
          feeAssetInfo: { symbol: 'B', location: feeLoc }
        } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>
        const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')
        await chain.transferPolkadotXCM(input)
        expect(handleExecuteTransfer).toHaveBeenCalledWith(input)
        expect(spy).toHaveBeenCalledTimes(1)
      })

      it('should not call handleExecuteTransfer when both asset and feeAsset are native', async () => {
        const input = {
          ...mockInput,
          destination: 'Acala',
          assetInfo: { symbol: 'DOT', amount: 100n, location: DOT_LOC },
          feeAssetInfo: { symbol: 'DOT', location: DOT_LOC }
        } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>
        await chain.transferPolkadotXCM(input)
        expect(handleExecuteTransfer).not.toHaveBeenCalled()
        expect(transferPolkadotXcm).toHaveBeenCalled()
      })
    })
  })

  describe('shouldUseExecuteTransfer', () => {
    const DOT_LOC = { parents: 1, interior: 'Here' }
    const OTHER_LOC = {
      parents: 1,
      interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }] }
    }

    beforeEach(() => {
      vi.spyOn(mockApi, 'findNativeAssetInfoOrThrow').mockReturnValue({
        symbol: 'DOT',
        location: DOT_LOC
      } as TAssetInfo)
      vi.mocked(isAssetEqual).mockImplementation(
        (a, b) => JSON.stringify(a?.location) === JSON.stringify(b?.location)
      )
    })

    const opts = (extra: object) =>
      ({ ...mockInput, ...extra }) as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    it('returns false when no fee asset is provided', () => {
      expect(
        chain.shouldUseExecuteTransfer(opts({ assetInfo: { symbol: 'USDT', location: OTHER_LOC } }))
      ).toBe(false)
    })

    it('returns false when an overridden asset is set', () => {
      expect(
        chain.shouldUseExecuteTransfer(
          opts({
            assetInfo: { symbol: 'USDT', location: OTHER_LOC },
            feeAssetInfo: { symbol: 'DOT', location: DOT_LOC },
            overriddenAsset: []
          })
        )
      ).toBe(false)
    })

    it('returns false for KSM asset', () => {
      expect(
        chain.shouldUseExecuteTransfer(
          opts({
            assetInfo: { symbol: 'KSM', location: OTHER_LOC },
            feeAssetInfo: { symbol: 'DOT', location: DOT_LOC }
          })
        )
      ).toBe(false)
    })

    it('returns false when both asset and fee asset are native', () => {
      expect(
        chain.shouldUseExecuteTransfer(
          opts({
            assetInfo: { symbol: 'DOT', location: DOT_LOC },
            feeAssetInfo: { symbol: 'DOT', location: DOT_LOC }
          })
        )
      ).toBe(false)
    })

    it.each([
      { label: 'non-native asset, native fee', assetLoc: OTHER_LOC, feeLoc: DOT_LOC },
      { label: 'native asset, non-native fee', assetLoc: DOT_LOC, feeLoc: OTHER_LOC }
    ])('returns true for $label', ({ assetLoc, feeLoc }) => {
      expect(
        chain.shouldUseExecuteTransfer(
          opts({
            assetInfo: { symbol: 'A', location: assetLoc },
            feeAssetInfo: { symbol: 'B', location: feeLoc }
          })
        )
      ).toBe(true)
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should call api.deserializeExtrinsics with correct parameters if assetId is defined', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: 1000n },
        recipient: '0x1234567890abcdef'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        params: {
          id: 123,
          target: { Id: mockInput.recipient },
          amount: BigInt(mockInput.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when assetId is defined and amount is ALL', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: 100n },
        recipient: '0x1234567890abcdef',
        isAmountAll: true,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: 123,
          dest: { Id: mockInput.recipient },
          keep_alive: false
        }
      })
    })

    it('should call api.deserializeExtrinsics with correct parameters if assetId is not defined', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', amount: 1000n, location: {} },
        recipient: '0x1234567890abcdef'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'ForeignAssets',
        method: 'transfer',
        params: {
          id: {},
          target: { Id: mockInput.recipient },
          amount: BigInt(mockInput.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when assetId is undefined and amount is ALL', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', amount: 100n, location: {} },
        recipient: '0x1234567890abcdef',
        isAmountAll: true,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'ForeignAssets',
        method: 'transfer_all',
        params: {
          id: {},
          dest: { Id: mockInput.recipient },
          keep_alive: false
        }
      })
    })
  })
})
