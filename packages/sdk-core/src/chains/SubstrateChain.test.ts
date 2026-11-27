import type { WithAmount } from '@paraspell/assets'
import { InvalidCurrencyError, type TAssetInfo } from '@paraspell/assets'
import type { TAssetsPallet } from '@paraspell/pallets'
import { getOtherAssetsPallets } from '@paraspell/pallets'
import type { TExternalChain, TParachain } from '@paraspell/sdk-common'
import { isExternalChain, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../api'
import { DOT_LOCATION, RELAY_LOCATION } from '../constants'
import {
  InvalidAddressError,
  NoXCMSupportImplementedError,
  RoutingResolutionError,
  ScenarioNotSupportedError,
  TypeAndThenUnavailableError,
  UnsupportedOperationError
} from '../errors'
import { getPalletInstance } from '../pallets'
import { handleTransactUsingSend, transferPolkadotXcm } from '../pallets/polkadotXcm'
import { createTypeAndThenCall } from '../transfer'
import type {
  BaseAssetsPallet,
  TSerializedExtrinsics,
  TTransferInternalOptions,
  TTransferLocalOptions
} from '../types'
import { getChain, handleExecuteTransfer, isNativeAssetTeleport, resolveDestChain } from '../utils'
import SubstrateChain from './SubstrateChain'

vi.mock('../constants/chains')
vi.mock('./getChainInstance', () => ({ getChainImpl: vi.fn() }))
vi.mock('../utils/location')

vi.mock('../pallets/polkadotXcm')

vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils')
  return {
    ...actual,
    createBeneficiaryLocation: vi.fn().mockReturnValue('beneficiaryLocation'),
    getRelayChainOf: vi.fn().mockReturnValue('Polkadot'),
    resolveDestChain: vi.fn(),
    handleExecuteTransfer: vi.fn(),
    getChain: vi.fn(),
    isNativeAssetTeleport: vi.fn()
  }
})

vi.mock('../utils/asset', async importActual => ({
  ...(await importActual()),
  createAsset: vi.fn().mockReturnValue('asset')
}))

vi.mock('@paraspell/pallets', { spy: true })

vi.mock('../pallets')

vi.mock('../transfer', () => ({
  createTypeAndThenCall: vi.fn(),
  validateFeeAssetSupport: vi.fn()
}))

const polkadotXcmTx: TSerializedExtrinsics = {
  module: 'PolkadotXcm',
  method: 'limited_reserve_transfer_assets',
  params: {}
}
const xTokensTx: TSerializedExtrinsics = {
  module: 'XTokens',
  method: 'transfer_multiasset',
  params: {}
}
const typeAndThenTx: TSerializedExtrinsics = {
  module: 'PolkadotXcm',
  method: 'transfer_assets_using_type_and_then',
  params: {}
}
const teleportTx: TSerializedExtrinsics = {
  module: 'PolkadotXcm',
  method: 'limited_teleport_assets',
  params: {}
}
const executeTx: TSerializedExtrinsics = { module: 'PolkadotXcm', method: 'execute', params: {} }
const sendTx: TSerializedExtrinsics = { module: 'PolkadotXcm', method: 'send', params: {} }

class PolkadotXcmChain extends SubstrateChain<unknown, unknown, unknown> {
  transferPolkadotXCM() {
    return Promise.resolve(polkadotXcmTx)
  }
}

class XTokensChain extends SubstrateChain<unknown, unknown, unknown> {
  transferXTokens() {
    return xTokensTx
  }
}

class DualPalletChain extends PolkadotXcmChain {
  transferXTokens() {
    return xTokensTx
  }
}

class ExecuteTransferChain extends PolkadotXcmChain {
  shouldUseExecuteTransfer() {
    return true
  }
}

class NoXcmChain extends SubstrateChain<unknown, unknown, unknown> {}

const mockPallets = (pallets: Partial<Record<TAssetsPallet, Partial<BaseAssetsPallet>>>) =>
  vi.mocked(getPalletInstance).mockImplementation(type => {
    const pallet = pallets[type]
    if (!pallet) throw new Error(`Unexpected pallet ${type}`)
    return pallet as BaseAssetsPallet
  })

describe('Parachain', () => {
  let chain: DualPalletChain

  const api = {
    hasMethod: vi.fn(),
    getXcmPallet: vi.fn().mockReturnValue('PolkadotXcm'),
    accountToHex: vi.fn(),
    createApiForChain: vi.fn(),
    deserializeExtrinsics: vi.fn((call: TSerializedExtrinsics) => call),
    getFromRpc: vi.fn(),
    clone: vi.fn(),
    findAssetInfo: vi.fn(),
    getParaId: vi.fn().mockReturnValue(1000),
    getNativeAssetSymbol: vi.fn(),
    getRelayChainSymbol: vi.fn().mockReturnValue('DOT'),
    localizeLocation: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const mockTypeAndThenSupport = (supported: boolean) =>
    vi
      .spyOn(api, 'hasMethod')
      .mockImplementation((pallet, method) =>
        Promise.resolve(
          pallet !== 'PolkadotXcm' || method !== 'transfer_assets_using_type_and_then' || supported
        )
      )

  beforeEach(() => {
    chain = new DualPalletChain('Acala', 'TestChain', 'Polkadot', Version.V4)
    vi.spyOn(api, 'getNativeAssetSymbol').mockReturnValue('DOT')
    mockTypeAndThenSupport(true)
    vi.mocked(isNativeAssetTeleport).mockReturnValue(false)
    vi.mocked(getPalletInstance).mockReset()
    vi.mocked(getOtherAssetsPallets).mockReset()
    vi.mocked(getOtherAssetsPallets).mockReturnValue(['Tokens'])
    vi.mocked(handleExecuteTransfer).mockResolvedValue(executeTx)
    vi.mocked(handleTransactUsingSend).mockResolvedValue(sendTx)
  })

  it('should get the name', () => {
    expect(chain.info).toBe('TestChain')
  })

  it('should get the ecosystem', () => {
    expect(chain.ecosystem).toBe('Polkadot')
  })

  it('should get the chain', () => {
    expect(chain.chain).toBe('Acala')
  })

  it('should get the version', () => {
    expect(chain.version).toBe(Version.V4)
  })

  it('allows sending and receiving by default', () => {
    expect(chain.isSendingTempDisabled({ symbol: 'DOT' } as TAssetInfo)).toBe(false)
    expect(chain.isReceivingTempDisabled('ParaToPara')).toBe(false)
    expect(chain.canReceiveFrom('Hydration')).toBe(true)
  })

  describe('transfer', () => {
    const DOT = { symbol: 'DOT', amount: 100n, location: RELAY_LOCATION }
    const ASTR = {
      symbol: 'ASTR',
      amount: 100n,
      location: { parents: 1, interior: { X1: { Parachain: 2000 } } }
    }
    const PEN = {
      symbol: 'PEN',
      amount: 100n,
      location: { parents: 1, interior: { X1: { Parachain: 2094 } } }
    }
    const USDT_EXTERNAL = {
      symbol: 'USDT',
      amount: 100n,
      location: { parents: 2, interior: { X1: [{ Parachain: 1000 }] } }
    }
    const KSM_BRIDGED = {
      symbol: 'KSM',
      amount: 100n,
      location: { parents: 2, interior: { X1: [{ GlobalConsensus: { kusama: null } }] } }
    }
    const WETH = {
      symbol: 'WETH',
      amount: 100n,
      location: {
        parents: 2,
        interior: { X1: [{ GlobalConsensus: { Ethereum: { chainId: 1 } } }] }
      }
    }

    const createOptions = (
      to: TParachain | TExternalChain,
      assetInfo: Partial<WithAmount<TAssetInfo>>,
      extra: Partial<TTransferInternalOptions<unknown, unknown, unknown>> = {}
    ) => {
      vi.mocked(resolveDestChain).mockReturnValue(isExternalChain(to) ? undefined : to)
      return {
        api,
        to,
        recipient: 'destinationAddress',
        assetInfo,
        ...extra
      } as TTransferInternalOptions<unknown, unknown, unknown>
    }

    const mockDestination = ({ canReceive = true, receivingDisabled = false } = {}) =>
      vi.mocked(getChain).mockReturnValue({
        canReceiveFrom: () => canReceive,
        isReceivingTempDisabled: () => receivingDisabled
      } as unknown as ReturnType<typeof getChain>)

    beforeEach(() => {
      mockDestination()
      vi.mocked(createTypeAndThenCall).mockResolvedValue(typeAndThenTx)
      vi.mocked(transferPolkadotXcm).mockResolvedValue(teleportTx)
    })

    it('uses the chain transfer for relay assets', async () => {
      const chain = new PolkadotXcmChain('Astar', 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions('Hydration', DOT))).toBe(polkadotXcmTx)
    })

    it('prefers PolkadotXcm when both pallets are implemented', async () => {
      const chain = new DualPalletChain('Acala', 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions('Astar', DOT))).toBe(polkadotXcmTx)
    })

    it('uses type-and-then for substrate bridge transfers', async () => {
      const chain = new PolkadotXcmChain('AssetHubPolkadot', 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions('AssetHubKusama', KSM_BRIDGED))).toBe(typeAndThenTx)
    })

    it('uses type-and-then for external assets routed via AssetHub', async () => {
      const chain = new PolkadotXcmChain('Acala', 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions('Darwinia', USDT_EXTERNAL))).toBe(typeAndThenTx)
      expect(createTypeAndThenCall).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: 'Acala',
          assetInfo: USDT_EXTERNAL,
          destination: 'Darwinia'
        })
      )
    })

    it('uses the chain transfer for external assets sent from AssetHub', async () => {
      const chain = new PolkadotXcmChain('AssetHubPolkadot', 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions('Hydration', WETH))).toBe(polkadotXcmTx)
    })

    it('uses the chain transfer for external assets sent to Ethereum', async () => {
      const chain = new PolkadotXcmChain('Hydration', 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions('Ethereum', WETH))).toBe(polkadotXcmTx)
    })

    it('uses type-and-then for relay assets on XTokens chains', async () => {
      const chain = new XTokensChain('Pendulum', 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions('Hydration', DOT))).toBe(typeAndThenTx)
    })

    it('uses XTokens for non-relay assets on XTokens chains', async () => {
      const chain = new XTokensChain('Pendulum', 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions('Hydration', PEN))).toBe(xTokensTx)
    })

    it('uses limited_teleport_assets for native asset teleports', async () => {
      vi.mocked(isNativeAssetTeleport).mockReturnValue(true)
      const chain = new PolkadotXcmChain('Acala', 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions('AssetHubPolkadot', ASTR))).toBe(teleportTx)
      expect(transferPolkadotXcm).toHaveBeenCalledWith(
        expect.objectContaining({ assetInfo: ASTR }),
        'limited_teleport_assets',
        'Unlimited'
      )
    })

    it('skips the teleport when the chain requires an execute transfer', async () => {
      vi.mocked(isNativeAssetTeleport).mockReturnValue(true)
      const chain = new ExecuteTransferChain('Acala', 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions('AssetHubPolkadot', ASTR))).toBe(polkadotXcmTx)
    })

    it('builds transact calls with execute on V5', async () => {
      const chain = new DualPalletChain('Acala', 'TestChain', 'Polkadot', Version.V5)
      const options = createOptions('AssetHubPolkadot', DOT, {
        version: Version.V5,
        transactOptions: { call: '0x01' }
      })

      expect(await chain.transfer(options)).toBe(executeTx)
    })

    it('builds transact calls with send below V5', async () => {
      const chain = new DualPalletChain('Acala', 'TestChain', 'Polkadot', Version.V4)
      const options = createOptions('AssetHubPolkadot', DOT, {
        version: Version.V4,
        transactOptions: { call: '0x01' }
      })

      expect(await chain.transfer(options)).toBe(sendTx)
    })

    it('passes the user fee asset to the chain transfer', async () => {
      const chain = new PolkadotXcmChain('Astar', 'TestChain', 'Polkadot', Version.V5)
      const feeAsset = { symbol: 'USDT', decimals: 6, location: RELAY_LOCATION } as TAssetInfo
      const transferPolkadotXCMSpy = vi.spyOn(chain, 'transferPolkadotXCM')

      await chain.transfer(createOptions('Hydration', DOT, { feeAsset }))

      expect(transferPolkadotXCMSpy).toHaveBeenCalledWith(
        expect.objectContaining({ feeAssetInfo: feeAsset })
      )
    })

    it('throws TypeAndThenUnavailableError for relay assets on XTokens chains without type-and-then', async () => {
      mockTypeAndThenSupport(false)
      const chain = new XTokensChain('Pendulum', 'TestChain', 'Polkadot', Version.V5)

      await expect(chain.transfer(createOptions('Hydration', DOT))).rejects.toThrow(
        TypeAndThenUnavailableError
      )
    })

    it('throws TypeAndThenUnavailableError for PolkadotXcm chains without type-and-then', async () => {
      mockTypeAndThenSupport(false)
      const chain = new PolkadotXcmChain('Acala', 'TestChain', 'Polkadot', Version.V5)

      await expect(chain.transfer(createOptions('Hydration', ASTR))).rejects.toThrow(
        TypeAndThenUnavailableError
      )
    })

    it('uses XTokens without requiring type-and-then', async () => {
      mockTypeAndThenSupport(false)
      const chain = new XTokensChain('Pendulum', 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions('Hydration', PEN))).toBe(xTokensTx)
    })

    it('throws when sending is disabled', async () => {
      class SendDisabledChain extends PolkadotXcmChain {
        isSendingTempDisabled() {
          return true
        }
      }
      const chain = new SendDisabledChain('Acala', 'TestChain', 'Polkadot', Version.V4)

      await expect(chain.transfer(createOptions('Astar', DOT))).rejects.toThrow(
        'Sending DOT from Acala is temporarily disabled'
      )
    })

    it('throws when receiving is disabled', async () => {
      mockDestination({ receivingDisabled: true })
      const chain = new PolkadotXcmChain('Acala', 'TestChain', 'Polkadot', Version.V4)

      await expect(chain.transfer(createOptions('Astar', DOT))).rejects.toThrow(
        'Receiving on Astar is temporarily disabled'
      )
    })

    it('throws when the destination cannot receive from the origin', async () => {
      mockDestination({ canReceive: false })
      const chain = new PolkadotXcmChain('Acala', 'TestChain', 'Polkadot', Version.V4)

      await expect(chain.transfer(createOptions('Astar', DOT))).rejects.toThrow(
        ScenarioNotSupportedError
      )
    })

    it('throws NoXCMSupportImplementedError when no transfer method is implemented', async () => {
      const chain = new NoXcmChain('Acala', 'TestChain', 'Polkadot', Version.V4)

      await expect(chain.transfer(createOptions('Astar', ASTR))).rejects.toThrow(
        NoXCMSupportImplementedError
      )
    })
  })

  it('should create xcm asset', () => {
    const result = chain.createAsset(
      api,
      {
        symbol: 'DOT',
        decimals: 10,
        existentialDeposit: '1000',
        isNative: true,
        amount: 1000n,
        location: RELAY_LOCATION
      },
      Version.V5
    )

    expect(result).toBe('asset')
  })

  describe('transferLocal', () => {
    it('should throw an error if the address is location', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: '', location: {}, amount: 100n },
        sender: '0x456',
        recipient: DOT_LOCATION
      } as TTransferInternalOptions<unknown, unknown, unknown>

      await expect(chain.transferLocal(options)).rejects.toThrow(InvalidAddressError)
    })

    it('should throw an error when fee asset is provided', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'DOT', amount: 100n, decimals: 10 },
        sender: '0x456',
        recipient: '0x123',
        feeAsset: { symbol: 'USDT', decimals: 12, assetId: '1', isFeeAsset: true },
        to: 'Acala',
        currency: { symbol: 'DOT', amount: 100n },
        version: Version.V4,
        isAmountAll: false
      } as TTransferInternalOptions<unknown, unknown, unknown>

      await expect(chain.transferLocal(options)).rejects.toThrow(UnsupportedOperationError)
    })

    it('builds a Balances transfer for native assets', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'DOT', isNative: true, location: {}, amount: 100n },
        sender: '0x456',
        recipient: '0x123'
      } as TTransferInternalOptions<unknown, unknown, unknown>

      expect(await chain.transferLocal(options)).toEqual({
        module: 'Balances',
        method: 'transfer_allow_death',
        params: { dest: { Id: '0x123' }, value: 100n }
      })
    })

    it('builds a Tokens transfer for foreign assets', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: '123', amount: 100n },
        sender: '0x456',
        recipient: '0x123'
      } as TTransferInternalOptions<unknown, unknown, unknown>

      expect(await chain.transferLocal(options)).toEqual({
        module: 'Tokens',
        method: 'transfer',
        params: { dest: { Id: '0x123' }, currency_id: 123n, amount: 100n }
      })
    })

    it('should fetch the sender balance for keepAlive transfers', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: '123', amount: 100n },
        sender: '5Sender',
        recipient: '0x123',
        isAmountAll: false,
        keepAlive: true
      } as TTransferInternalOptions<unknown, unknown, unknown>

      const getBalanceSpy = vi.spyOn(chain, 'getBalance').mockResolvedValue(1000n)

      await chain.transferLocal(options)

      expect(getBalanceSpy).toHaveBeenCalledWith(api, '5Sender', options.assetInfo)
    })

    it('should use the minted balance for dry run bypass keepAlive transfers', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: '123', amount: 100n, existentialDeposit: '10' },
        sender: '5Sender',
        recipient: '0x123',
        isAmountAll: false,
        isDryRunBypass: true,
        keepAlive: true
      } as TTransferInternalOptions<unknown, unknown, unknown>

      vi.spyOn(chain, 'getBalance').mockResolvedValue(30n)
      const transferLocalNonNativeSpy = vi.spyOn(chain, 'transferLocalNonNativeAsset')

      await chain.transferLocal(options)

      expect(transferLocalNonNativeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ balance: 110n })
      )
    })

    it('should not top up the balance for dry run bypass when sending ALL', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: '123', amount: 2n, existentialDeposit: '10' },
        sender: '5Sender',
        recipient: '0x123',
        isAmountAll: true,
        isDryRunBypass: true,
        keepAlive: true
      } as TTransferInternalOptions<unknown, unknown, unknown>

      vi.spyOn(chain, 'getBalance').mockResolvedValue(0n)
      const transferLocalNonNativeSpy = vi.spyOn(chain, 'transferLocalNonNativeAsset')

      await chain.transferLocal(options)

      expect(transferLocalNonNativeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ balance: 0n })
      )
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw an error if assetId is undefined', () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: undefined, amount: 100n },
        sender: '0x456',
        recipient: '0x123'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(options)).toThrow(InvalidCurrencyError)
    })
  })

  describe('getCustomCurrencyId', () => {
    it('returns undefined by default', () => {
      const dummyAsset = { symbol: 'USDT' } as TAssetInfo
      const dummyApi = {} as unknown as PolkadotApi<unknown, unknown, unknown>
      expect(chain.getCustomCurrencyId(dummyApi, dummyAsset)).toBeUndefined()
    })
  })

  describe('getBalanceNative', () => {
    it('delegates to the System pallet', async () => {
      const systemPallet = { getBalance: vi.fn().mockResolvedValue(42n) }
      mockPallets({ System: systemPallet })

      const asset = { symbol: 'DOT', amount: 10n } as WithAmount<TAssetInfo>

      expect(await chain.getBalanceNative(api, '5FMock', asset)).toBe(42n)
      expect(systemPallet.getBalance).toHaveBeenCalledWith(api, '5FMock', asset)
    })
  })

  describe('getBalanceForeign', () => {
    it('throws when no foreign asset pallets are registered', async () => {
      vi.mocked(getOtherAssetsPallets).mockReturnValueOnce([])

      await expect(
        chain.getBalanceForeign(api, '5FMock', {
          symbol: 'USDT'
        } as TAssetInfo)
      ).rejects.toThrow(RoutingResolutionError)
    })

    it('tries pallets sequentially until balance resolves', async () => {
      vi.mocked(getOtherAssetsPallets).mockReturnValueOnce(['Tokens', 'ForeignAssets'])

      const tokensPallet = { getBalance: vi.fn().mockRejectedValue(new Error('Tokens failed')) }
      const foreignAssetsPallet = { getBalance: vi.fn().mockResolvedValue(55n) }
      mockPallets({ Tokens: tokensPallet, ForeignAssets: foreignAssetsPallet })

      const customId = Symbol('custom')
      vi.spyOn(chain, 'getCustomCurrencyId').mockReturnValue(customId)

      const asset = { symbol: 'USDT' } as TAssetInfo

      expect(await chain.getBalanceForeign(api, '5FMock', asset)).toBe(55n)
      expect(tokensPallet.getBalance).toHaveBeenCalledWith(api, '5FMock', asset, customId)
      expect(foreignAssetsPallet.getBalance).toHaveBeenCalledWith(api, '5FMock', asset, customId)
    })

    it('throws the last encountered error when every pallet fails', async () => {
      vi.mocked(getOtherAssetsPallets).mockReturnValueOnce(['Tokens'])

      const expectedError = new Error('all failed')
      mockPallets({ Tokens: { getBalance: vi.fn().mockRejectedValue(expectedError) } })

      await expect(
        chain.getBalanceForeign(api, '5FMock', {
          symbol: 'USDT'
        } as TAssetInfo)
      ).rejects.toThrow(expectedError)
    })
  })

  describe('getBalance', () => {
    it('routes native assets to getBalanceNative', async () => {
      const nativeAsset = { symbol: 'DOT' } as TAssetInfo

      const nativeSpy = vi.spyOn(chain, 'getBalanceNative').mockResolvedValue(11n)
      vi.spyOn(chain, 'getBalanceForeign').mockResolvedValue(0n)

      expect(await chain.getBalance(api, '5FMock', nativeAsset)).toBe(11n)
      expect(nativeSpy).toHaveBeenCalledWith(api, '5FMock', nativeAsset)
    })

    it('routes non-native assets to getBalanceForeign', async () => {
      const foreignAsset = { symbol: 'USDT' } as TAssetInfo

      vi.spyOn(chain, 'getBalanceNative').mockResolvedValue(0n)
      const foreignSpy = vi.spyOn(chain, 'getBalanceForeign').mockResolvedValue(22n)

      expect(await chain.getBalance(api, '5FMock', foreignAsset)).toBe(22n)
      expect(foreignSpy).toHaveBeenCalledWith(api, '5FMock', foreignAsset)
    })
  })

  describe('mint', () => {
    it('routes the native asset to the native pallet and forwards the chain instance', async () => {
      const palletMock = { mint: vi.fn().mockResolvedValue({ balanceTx: { module: 'Balances' } }) }
      mockPallets({ Balances: palletMock })

      const asset = { symbol: 'DOT', isNative: true, amount: 5n } as WithAmount<TAssetInfo>

      expect(await chain.mint(api, '5FMock', asset, 1n)).toEqual({
        balanceTx: { module: 'Balances' }
      })
      expect(palletMock.mint).toHaveBeenCalledWith(api, '5FMock', asset, 1n, chain)
    })

    it('routes non-native assets to an other-assets pallet', async () => {
      vi.mocked(getOtherAssetsPallets).mockReturnValue(['Tokens'])
      const palletMock = { mint: vi.fn().mockResolvedValue({ balanceTx: { module: 'Tokens' } }) }
      mockPallets({ Tokens: palletMock })

      const asset = {
        symbol: 'USDT',
        isNative: false,
        assetId: '1',
        amount: 5n
      } as WithAmount<TAssetInfo>

      expect(await chain.mint(api, '5FMock', asset, 0n)).toEqual({
        balanceTx: { module: 'Tokens' }
      })
      expect(palletMock.mint).toHaveBeenCalledWith(api, '5FMock', asset, 0n, chain)
    })
  })

  describe('resolveMintConfig', () => {
    const evmApi = (isEvm: boolean) =>
      ({ isChainEvm: vi.fn().mockReturnValue(isEvm) }) as unknown as PolkadotApi<
        unknown,
        unknown,
        unknown
      >

    it('enables the id prefix for non-EVM chains', () => {
      expect(chain.resolveMintConfig(evmApi(false))).toEqual({ useIdPrefix: true })
    })

    it('disables the id prefix for EVM chains', () => {
      expect(chain.resolveMintConfig(evmApi(true))).toEqual({ useIdPrefix: false })
    })
  })
})
