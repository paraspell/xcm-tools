import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { findAssetInfoByLoc, InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
import { getPalletInstance } from '../../pallets'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  TPolkadotXCMTransferOptions,
  TSerializedExtrinsics,
  TTransferLocalOptions
} from '../../types'
import { getChain, handleExecuteTransfer } from '../../utils'
import { buildErc20StorageMint } from '../../utils/asset/hydrationErc20Mint'
import SubstrateChain from '../SubstrateChain'
import type Hydration from './Hydration'

vi.mock('@paraspell/assets', async importActual => ({
  ...(await importActual()),
  findAssetInfoByLoc: vi.fn()
}))

vi.mock('../../pallets/polkadotXcm')
vi.mock('../../utils/transfer')
vi.mock('../../utils/asset/hydrationErc20Mint')

const HOLLAR_ERC20 = { balanceSlot: 3, contract: '0x531a654d1696ed52e7275a8cede955e82620f99a' }

describe('Hydration', () => {
  let hydration: Hydration<unknown, unknown, unknown>

  const mockExtrinsic = {} as unknown

  beforeEach(() => {
    vi.clearAllMocks()
    hydration = getChain<unknown, unknown, unknown, 'Hydration'>('Hydration')
    vi.mocked(transferPolkadotXcm).mockResolvedValue(mockExtrinsic)
  })

  it('should initialize with correct values', () => {
    expect(hydration.chain).toBe('Hydration')
    expect(hydration.info).toBe('hydradx')
    expect(hydration.ecosystem).toBe('Polkadot')
    expect(hydration.version).toBe(Version.V5)
  })

  it('disables the id prefix for minting', () => {
    const api = { isChainEvm: () => false } as unknown as PolkadotApi<unknown, unknown, unknown>
    expect(hydration.resolveMintConfig(api)).toMatchObject({ useIdPrefix: false })
  })

  describe('transferPolkadotXCM', () => {
    let mockApi: PolkadotApi<unknown, unknown, unknown>
    let mockInput: TPolkadotXCMTransferOptions<unknown, unknown, unknown>

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
        clone: vi.fn(),
        findAssetInfoOrThrow: vi.fn()
      } as unknown as PolkadotApi<unknown, unknown, unknown>

      mockInput = {
        api: mockApi,
        recipient: '0xPolkadotAddress',
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
      } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

      vi.mocked(findAssetInfoByLoc).mockReturnValue(undefined)
    })

    it('delegates Ethereum destination to transferPolkadotXcm', async () => {
      vi.mocked(findAssetInfoByLoc).mockReturnValue({
        assetId: '0x1234567890abcdef',
        symbol: 'WETH',
        decimals: 18,
        location: {
          parents: 2,
          interior: 'Here'
        }
      })

      const input = {
        ...mockInput,
        sender: '5Gw3s7q'
      }

      await hydration.transferPolkadotXCM(input)

      expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
    })

    it('should call transferPolkadotXcm when feeAsset and overriddenAsset are both set', async () => {
      const input = {
        ...mockInput,
        api: mockApi,
        assetInfo: {
          symbol: 'USDC',
          assetId: '123',
          amount: 1000n,
          location: DOT_LOCATION
        },
        feeAssetInfo: {
          symbol: 'USDT',
          assetId: '456',
          location: DOT_LOCATION
        },
        overriddenAsset: [{ id: DOT_LOCATION, fun: { Fungible: 1000n } }],
        destination: 'Hydration'
      } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

      await hydration.transferPolkadotXCM(input)

      expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
    })

    it('should call handleExecuteTransfer for non-native asset/feeAsset', async () => {
      const mockTx = {} as TSerializedExtrinsics

      const mockApi = {
        deserializeExtrinsics: vi.fn(),
        findNativeAssetInfoOrThrow: vi
          .fn()
          .mockReturnValue({ symbol: 'HDX', location: { parents: 0, interior: 'Here' } })
      } as unknown as PolkadotApi<unknown, unknown, unknown>

      vi.mocked(handleExecuteTransfer).mockResolvedValue(mockTx)

      const input = {
        ...mockInput,
        api: mockApi,
        sender: '0xPolkadotSender',
        assetInfo: {
          symbol: 'USDC',
          assetId: '123',
          amount: 1000n,
          location: DOT_LOCATION
        },
        feeAssetInfo: {
          symbol: 'USDT',
          assetId: '456',
          location: DOT_LOCATION
        },
        destination: 'Hydration'
      } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      await hydration.transferPolkadotXCM(input)

      expect(spy).toHaveBeenCalledWith(mockTx)
    })
  })

  describe('shouldUseExecuteTransfer', () => {
    const HDX_LOC = { parents: 0, interior: 'Here' }
    const OTHER_LOC = { parents: 1, interior: 'Here' }

    const api = {
      findNativeAssetInfoOrThrow: vi.fn().mockReturnValue({ symbol: 'HDX', location: HDX_LOC })
    } as unknown as PolkadotApi<unknown, unknown, unknown>

    const opts = (extra: object) =>
      ({
        api,
        assetInfo: { symbol: 'HDX', location: HDX_LOC } as TAssetInfo,
        ...extra
      }) as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    it('returns false when no fee asset is provided', () => {
      expect(hydration.shouldUseExecuteTransfer(opts({}))).toBe(false)
    })

    it('returns false when an overridden asset is set', () => {
      expect(
        hydration.shouldUseExecuteTransfer(
          opts({ feeAssetInfo: { location: OTHER_LOC }, overriddenAsset: [] })
        )
      ).toBe(false)
    })

    it('returns false when both asset and fee asset are native', () => {
      expect(
        hydration.shouldUseExecuteTransfer(
          opts({ assetInfo: { location: HDX_LOC }, feeAssetInfo: { location: HDX_LOC } })
        )
      ).toBe(false)
    })

    it.each([
      { label: 'non-native asset, native fee', assetLoc: OTHER_LOC, feeLoc: HDX_LOC },
      { label: 'native asset, non-native fee', assetLoc: HDX_LOC, feeLoc: OTHER_LOC }
    ])('returns true for $label', ({ assetLoc, feeLoc }) => {
      expect(
        hydration.shouldUseExecuteTransfer(
          opts({ assetInfo: { location: assetLoc }, feeAssetInfo: { location: feeLoc } })
        )
      ).toBe(true)
    })
  })

  const mockApi = {
    deserializeExtrinsics: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  describe('transferLocalNativeAsset', () => {
    it('should call api.deserializeExtrinsics with correct parameters', async () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'DOT', amount: 1000n },
        recipient: '0x1234567890abcdef',
        balance: 2000n,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      await hydration.transferLocalNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_allow_death',
        params: {
          dest: mockInput.recipient,
          value: BigInt(mockInput.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when amount is ALL', async () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'DOT', amount: 100n },
        recipient: '0x1234567890abcdef',
        balance: 2000n,
        sender: 'sender',
        isAmountAll: true,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      await hydration.transferLocalNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_all',
        params: {
          dest: mockInput.recipient,
          keep_alive: false
        }
      })
    })
  })

  describe('getBalanceForeign', () => {
    it('reads ERC20 balances through the Currencies pallet', async () => {
      const asset = { symbol: 'HOLLAR', assetId: '222', erc20: HOLLAR_ERC20 } as TAssetInfo
      const spy = vi
        .spyOn(getPalletInstance('Currencies'), 'getBalance')
        .mockResolvedValue(2294586420888330679986894n)

      const result = await hydration.getBalanceForeign(mockApi, '7L53Addr', asset)

      expect(spy).toHaveBeenCalledWith(mockApi, '7L53Addr', asset)
      expect(result).toBe(2294586420888330679986894n)
    })

    it('falls back to the default pallets for non-ERC20 assets', async () => {
      const asset = { symbol: 'DOT', assetId: '5' } as TAssetInfo
      const spy = vi.spyOn(SubstrateChain.prototype, 'getBalanceForeign').mockResolvedValue(42n)

      const result = await hydration.getBalanceForeign(mockApi, '7L53Addr', asset)

      expect(spy).toHaveBeenCalledWith(mockApi, '7L53Addr', asset)
      expect(result).toBe(42n)
    })
  })

  describe('mint', () => {
    const erc20Asset = {
      symbol: 'HOLLAR',
      assetId: '222',
      erc20: HOLLAR_ERC20,
      amount: 1000n
    } as WithAmount<TAssetInfo>

    it('mints ERC20 assets through an EVM storage override', async () => {
      const balanceTx = {
        module: 'System',
        method: 'set_storage',
        params: { items: [] }
      } as unknown as TSerializedExtrinsics
      vi.mocked(buildErc20StorageMint).mockReturnValue({ balanceTx })

      const res = await hydration.mint(mockApi, '7Addr', erc20Asset, 500n)

      expect(buildErc20StorageMint).toHaveBeenCalledWith(
        mockApi,
        '7Addr',
        erc20Asset,
        HOLLAR_ERC20,
        1500n
      )
      expect(res).toEqual({ balanceTx })
    })

    it('uses the default mint for non-ERC20 assets', async () => {
      const asset = { symbol: 'DOT', assetId: '5', amount: 1000n } as WithAmount<TAssetInfo>
      const superMint = vi
        .spyOn(SubstrateChain.prototype, 'mint')
        .mockResolvedValue({ balanceTx: {} as TSerializedExtrinsics })

      await hydration.mint(mockApi, '7Addr', asset, 0n)

      expect(buildErc20StorageMint).not.toHaveBeenCalled()
      expect(superMint).toHaveBeenCalledWith(mockApi, '7Addr', asset, 0n)
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw InvalidCurrencyError if asset is not a foreign asset', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'DOT', amount: 1000n },
        recipient: '0x1234567890abcdef'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => hydration.transferLocalNonNativeAsset(mockInput)).toThrow(InvalidCurrencyError)
    })

    it('should throw InvalidCurrencyError if assetId is undefined', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', amount: 1000n },
        recipient: '0x1234567890abcdef'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => hydration.transferLocalNonNativeAsset(mockInput)).toThrow(InvalidCurrencyError)
    })

    it('should call api.deserializeExtrinsics with correct parameters', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: 1000n },
        recipient: '0x1234567890abcdef'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      hydration.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        params: {
          dest: mockInput.recipient,
          currency_id: 123,
          amount: BigInt(mockInput.assetInfo.amount)
        }
      })
    })

    it('should use Currencies.transfer for ERC20 assets', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'HOLLAR', assetId: '222', erc20: HOLLAR_ERC20, amount: 1000n },
        recipient: '0x1234567890abcdef'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      hydration.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Currencies',
        method: 'transfer',
        params: {
          dest: mockInput.recipient,
          currency_id: 222,
          amount: 1000n
        }
      })
    })

    it('should transfer the full balance for ERC20 assets when amount is ALL', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'HOLLAR', assetId: '222', erc20: HOLLAR_ERC20, amount: 1n },
        recipient: '0x1234567890abcdef',
        isAmountAll: true,
        balance: 5000n
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      hydration.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Currencies',
        method: 'transfer',
        params: {
          dest: mockInput.recipient,
          currency_id: 222,
          amount: 5000n
        }
      })
    })

    it('should leave the ED behind for ERC20 assets when amount is ALL and keepAlive is set', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: {
          symbol: 'HOLLAR',
          assetId: '222',
          erc20: HOLLAR_ERC20,
          existentialDeposit: '20000000000000000',
          amount: 1n
        },
        recipient: '0x1234567890abcdef',
        isAmountAll: true,
        keepAlive: true,
        balance: 20000000000005000n
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      hydration.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Currencies',
        method: 'transfer',
        params: {
          dest: mockInput.recipient,
          currency_id: 222,
          amount: 5000n
        }
      })
    })

    it('should call transfer_all when amount is ALL', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: 100n },
        recipient: '0x1234567890abcdef',
        isAmountAll: true,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      hydration.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest: mockInput.recipient,
          currency_id: 123,
          keep_alive: false
        }
      })
    })
  })
})
