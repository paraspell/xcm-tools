import type { WithAmount } from '@paraspell/assets'
import { InvalidCurrencyError, type TAssetInfo } from '@paraspell/assets'
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
import type { BaseAssetsPallet, TTransferLocalOptions } from '../types'
import { type TTransferInternalOptions } from '../types'
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

class TestParachainBase extends SubstrateChain<unknown, unknown, unknown> {
  throwIfTempDisabled() {}
}

class TestParachain extends TestParachainBase {
  transferXTokens() {
    return 'transferXTokens called'
  }

  transferPolkadotXCM() {
    return 'transferPolkadotXCM called'
  }
}

class OnlyPolkadotXCMParachain extends TestParachainBase {
  transferPolkadotXCM() {
    return 'transferPolkadotXCM called'
  }
}

class OnlyXTokensParachain extends TestParachainBase {
  transferXTokens() {
    return 'transferXTokens called'
  }
}

class ExecuteTransferParachain extends TestParachainBase {
  transferPolkadotXCM() {
    return 'transferPolkadotXCM called'
  }

  shouldUseExecuteTransfer() {
    return true
  }
}

class NoSupportParachain extends TestParachainBase {}

describe('Parachain', () => {
  let chain: TestParachain

  const api = {
    hasMethod: vi.fn(),
    getXcmPallet: vi.fn().mockReturnValue('PolkadotXcm'),
    accountToHex: vi.fn(),
    createApiForChain: vi.fn(),
    deserializeExtrinsics: vi.fn(),
    getFromRpc: vi.fn(),
    clone: vi.fn(),
    findAssetInfo: vi.fn(),
    getParaId: vi.fn().mockReturnValue(1000),
    getNativeAssetSymbol: vi.fn(),
    getRelayChainSymbol: vi.fn().mockReturnValue('DOT'),
    localizeLocation: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  beforeEach(() => {
    chain = new TestParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    vi.spyOn(api, 'getNativeAssetSymbol').mockReturnValue('DOT')
    vi.spyOn(api, 'hasMethod').mockResolvedValue(true)
    vi.mocked(isNativeAssetTeleport).mockReturnValue(false)
    vi.mocked(getPalletInstance).mockReset()
    vi.mocked(getOtherAssetsPallets).mockReset()
    vi.mocked(getOtherAssetsPallets).mockReturnValue(['Tokens'])
    vi.mocked(handleExecuteTransfer).mockResolvedValue({
      module: 'PolkadotXcm',
      method: 'execute',
      params: {}
    })
    vi.mocked(handleTransactUsingSend).mockResolvedValue({
      module: 'PolkadotXcm',
      method: 'send',
      params: {}
    })
  })

  it('should create an instance', () => {
    expect(chain).toBeDefined()
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
    type TTestChainClass = new (
      ...args: ConstructorParameters<typeof TestParachainBase>
    ) => TestParachainBase

    const CHAIN = 'transferPolkadotXCM called'
    const X_TOKENS = 'transferXTokens called'
    const TYPE_AND_THEN = 'transfer_assets_using_type_and_then called'
    const TELEPORT = 'limited_teleport_assets called'

    const DOT = { symbol: 'DOT', amount: 100n, location: RELAY_LOCATION }
    const ASTR = {
      symbol: 'ASTR',
      amount: 100n,
      location: { parents: 1, interior: { X1: { Parachain: 2000 } } }
    }
    const CFG = {
      symbol: 'CFG',
      amount: 100n,
      location: { parents: 1, interior: { X1: { Parachain: 2031 } } }
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

    beforeEach(() => {
      vi.mocked(getChain).mockReturnValue({
        canReceiveFrom: () => true,
        isReceivingTempDisabled: () => false
      } as unknown as ReturnType<typeof getChain>)
      vi.mocked(createTypeAndThenCall).mockResolvedValue({
        module: 'PolkadotXcm',
        method: 'transfer_assets_using_type_and_then',
        params: {}
      })
      vi.mocked(transferPolkadotXcm).mockImplementation((_options, method) =>
        Promise.resolve(`${method} called`)
      )
      vi.spyOn(api, 'deserializeExtrinsics').mockImplementation(({ method }) => `${method} called`)
    })

    it.each<{
      name: string
      Chain: TTestChainClass
      from: TParachain
      to: TParachain | TExternalChain
      asset: Partial<WithAmount<TAssetInfo>>
      route: string
    }>([
      {
        name: 'non-relay assets through the chain transfer',
        Chain: OnlyPolkadotXCMParachain,
        from: 'Acala',
        to: 'Astar',
        asset: ASTR,
        route: CHAIN
      },
      {
        name: 'relay assets through the chain transfer',
        Chain: OnlyPolkadotXCMParachain,
        from: 'Astar',
        to: 'Hydration',
        asset: DOT,
        route: CHAIN
      },
      {
        name: 'through PolkadotXcm when both pallets are implemented',
        Chain: TestParachain,
        from: 'Acala',
        to: 'Astar',
        asset: DOT,
        route: CHAIN
      },
      {
        name: 'substrate bridge transfers through type-and-then',
        Chain: OnlyPolkadotXCMParachain,
        from: 'AssetHubPolkadot',
        to: 'AssetHubKusama',
        asset: KSM_BRIDGED,
        route: TYPE_AND_THEN
      },
      {
        name: 'external assets via AssetHub through type-and-then',
        Chain: OnlyPolkadotXCMParachain,
        from: 'Acala',
        to: 'Darwinia',
        asset: USDT_EXTERNAL,
        route: TYPE_AND_THEN
      },
      {
        name: 'external assets to AssetHub through type-and-then',
        Chain: OnlyPolkadotXCMParachain,
        from: 'Acala',
        to: 'AssetHubPolkadot',
        asset: USDT_EXTERNAL,
        route: TYPE_AND_THEN
      },
      {
        name: 'external assets from AssetHub through the chain transfer',
        Chain: OnlyPolkadotXCMParachain,
        from: 'AssetHubPolkadot',
        to: 'Hydration',
        asset: WETH,
        route: CHAIN
      },
      {
        name: 'external assets to Ethereum through the chain transfer',
        Chain: OnlyPolkadotXCMParachain,
        from: 'Hydration',
        to: 'Ethereum',
        asset: WETH,
        route: CHAIN
      },
      {
        name: 'relay assets on XTokens chains through type-and-then',
        Chain: OnlyXTokensParachain,
        from: 'Centrifuge',
        to: 'Hydration',
        asset: DOT,
        route: TYPE_AND_THEN
      },
      {
        name: 'non-relay assets on XTokens chains through XTokens',
        Chain: OnlyXTokensParachain,
        from: 'Centrifuge',
        to: 'Hydration',
        asset: CFG,
        route: X_TOKENS
      }
    ])('routes $name', async ({ Chain, from, to, asset, route }) => {
      const chain = new Chain(from, 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions(to, asset))).toBe(route)
    })

    it.each([
      {
        name: 'uses limited_teleport_assets for native asset teleports',
        Chain: OnlyPolkadotXCMParachain,
        route: TELEPORT
      },
      {
        name: 'skips the teleport when execute transfer is required',
        Chain: ExecuteTransferParachain,
        route: CHAIN
      }
    ])('$name', async ({ Chain, route }) => {
      vi.mocked(isNativeAssetTeleport).mockReturnValue(true)
      const chain = new Chain('Acala', 'TestChain', 'Polkadot', Version.V5)

      expect(await chain.transfer(createOptions('AssetHubPolkadot', ASTR))).toBe(route)
    })

    it.each([
      { version: Version.V5, expected: 'execute called' },
      { version: Version.V4, expected: 'send called' }
    ])('builds transact calls as $expected for $version', async ({ version, expected }) => {
      const chain = new TestParachain('Acala', 'TestChain', 'Polkadot', version)
      const options = createOptions('AssetHubPolkadot', DOT, {
        version,
        transactOptions: { call: '0x01' }
      })

      expect(await chain.transfer(options)).toBe(expected)
    })

    it('passes the transfer options to createTypeAndThenCall', async () => {
      const chain = new OnlyPolkadotXCMParachain('Acala', 'TestChain', 'Polkadot', Version.V5)

      await chain.transfer(createOptions('Darwinia', USDT_EXTERNAL))

      expect(createTypeAndThenCall).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: 'Acala',
          assetInfo: USDT_EXTERNAL,
          destination: 'Darwinia'
        })
      )
    })

    it('passes the user fee asset to the chain transfer', async () => {
      const chain = new OnlyPolkadotXCMParachain('Astar', 'TestChain', 'Polkadot', Version.V5)
      const feeAsset = { symbol: 'USDT', decimals: 6, location: RELAY_LOCATION } as TAssetInfo
      const transferPolkadotXCMSpy = vi.spyOn(chain, 'transferPolkadotXCM')

      await chain.transfer(createOptions('Hydration', DOT, { feeAsset }))

      expect(transferPolkadotXCMSpy).toHaveBeenCalledWith(
        expect.objectContaining({ feeAssetInfo: feeAsset })
      )
    })

    it.each([
      {
        name: 'relay assets on XTokens chains',
        Chain: OnlyXTokensParachain,
        from: 'Centrifuge' as const,
        asset: DOT
      },
      {
        name: 'PolkadotXcm chains',
        Chain: OnlyPolkadotXCMParachain,
        from: 'Acala' as const,
        asset: ASTR
      }
    ])(
      'throws TypeAndThenUnavailableError for $name without type-and-then',
      async ({ Chain, from, asset }) => {
        const hasMethodSpy = vi.spyOn(api, 'hasMethod').mockResolvedValue(false)
        const chain = new Chain(from, 'TestChain', 'Polkadot', Version.V5)

        await expect(chain.transfer(createOptions('Hydration', asset))).rejects.toThrow(
          TypeAndThenUnavailableError
        )
        expect(hasMethodSpy).toHaveBeenCalledWith(
          'PolkadotXcm',
          'transfer_assets_using_type_and_then'
        )
        expect(createTypeAndThenCall).not.toHaveBeenCalled()
      }
    )

    it('skips the type-and-then check for XTokens transfers', async () => {
      const hasMethodSpy = vi.spyOn(api, 'hasMethod')
      const chain = new OnlyXTokensParachain('Centrifuge', 'TestChain', 'Polkadot', Version.V5)

      await chain.transfer(createOptions('Hydration', CFG))

      expect(hasMethodSpy).not.toHaveBeenCalled()
    })

    it('throws when sending is disabled', async () => {
      class SendDisabledParachain extends SubstrateChain<unknown, unknown, unknown> {
        isSendingTempDisabled() {
          return true
        }
      }
      const chain = new SendDisabledParachain('Acala', 'TestChain', 'Polkadot', Version.V4)

      await expect(chain.transfer(createOptions('Astar', DOT))).rejects.toThrow(
        'Sending DOT from Acala is temporarily disabled'
      )
    })

    it('throws when receiving is disabled', async () => {
      class ReceiveDisabledParachain extends SubstrateChain<unknown, unknown, unknown> {
        isReceivingTempDisabled() {
          return true
        }

        transferPolkadotXCM() {
          return Promise.resolve('transferPolkadotXCM called')
        }
      }
      const chain = new ReceiveDisabledParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
      vi.mocked(getChain).mockReturnValue(chain)

      await expect(chain.transfer(createOptions('Astar', DOT))).rejects.toThrow(
        'Receiving on Astar is temporarily disabled'
      )
    })

    it('throws when the destination cannot receive from the origin', async () => {
      vi.mocked(getChain).mockReturnValue({
        canReceiveFrom: () => false,
        isReceivingTempDisabled: () => false
      } as unknown as ReturnType<typeof getChain>)
      const chain = new TestParachain('Acala', 'TestChain', 'Polkadot', Version.V4)

      await expect(chain.transfer(createOptions('Astar', DOT))).rejects.toThrow(
        ScenarioNotSupportedError
      )
    })

    it('throws NoXCMSupportImplementedError when no transfer method is implemented', async () => {
      const chain = new NoSupportParachain('Acala', 'TestChain', 'Polkadot', Version.V4)

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

    it('should call transferLocalNativeAsset when asset is native', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'DOT', isNative: true, location: {}, amount: 100n },
        sender: '0x456',
        recipient: '0x123'
      } as TTransferInternalOptions<unknown, unknown, unknown>

      vi.spyOn(api, 'getNativeAssetSymbol').mockReturnValue('DOT')

      const transferLocalNativeSpy = vi.spyOn(chain, 'transferLocalNativeAsset')

      await chain.transferLocal(options)

      expect(transferLocalNativeSpy).toHaveBeenCalled()
    })

    it('should call transferLocalNonNativeAsset when asset is foreign', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: '123', amount: 100n },
        sender: '0x456',
        recipient: '0x123'
      } as TTransferInternalOptions<unknown, unknown, unknown>

      const transferLocalNonNativeSpy = vi.spyOn(chain, 'transferLocalNonNativeAsset')

      await chain.transferLocal(options)

      expect(transferLocalNonNativeSpy).toHaveBeenCalled()
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

  describe('transferLocalNativeAsset', () => {
    it('should create an API call', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'DOT', assetId: '', location: {}, amount: 100n },
        sender: '0x456',
        recipient: '0x123',
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(options.api, 'deserializeExtrinsics')

      await chain.transferLocalNativeAsset(options)

      expect(spy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_allow_death',
        params: {
          dest: { Id: options.recipient },
          value: BigInt(options.assetInfo.amount)
        }
      })
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw an error if the asset is not foreign', () => {
      const options = {
        api,
        assetInfo: { symbol: 'DOT', amount: 100n },
        sender: '0x456',
        recipient: '0x123'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(options)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error if assetId is undefined', () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: undefined, amount: 100n },
        sender: '0x456',
        recipient: '0x123'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(options)).toThrow(InvalidCurrencyError)
    })

    it('should create an API call', () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: '10', location: {}, amount: 100n },
        sender: '0x456',
        recipient: '0x123'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(options.api, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(options)

      expect(spy).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        params: {
          dest: { Id: options.recipient },
          currency_id: 10n,
          amount: BigInt(options.assetInfo.amount)
        }
      })
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
      const systemPallet = {
        getBalance: vi.fn().mockResolvedValue(42n)
      }

      vi.mocked(getPalletInstance).mockReturnValueOnce(systemPallet as unknown as BaseAssetsPallet)

      const asset = { symbol: 'DOT', amount: 10n } as WithAmount<TAssetInfo>

      const result = await chain.getBalanceNative(api, '5FMock', asset)

      expect(getPalletInstance).toHaveBeenCalledWith('System')
      expect(systemPallet.getBalance).toHaveBeenCalledWith(api, '5FMock', asset)
      expect(result).toBe(42n)
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

      const tokensPallet = {
        getBalance: vi.fn().mockRejectedValue(new Error('Tokens failed'))
      }
      const foreignAssetsPallet = {
        getBalance: vi.fn().mockResolvedValue(55n)
      }

      vi.mocked(getPalletInstance).mockImplementation(pallet => {
        if (pallet === 'Tokens') return tokensPallet as unknown as BaseAssetsPallet
        if (pallet === 'ForeignAssets') return foreignAssetsPallet as unknown as BaseAssetsPallet
        throw new Error('Unexpected pallet')
      })

      const customId = Symbol('custom')
      vi.spyOn(chain, 'getCustomCurrencyId').mockReturnValue(customId)

      const asset = { symbol: 'USDT' } as TAssetInfo

      const result = await chain.getBalanceForeign(api, '5FMock', asset)

      expect(tokensPallet.getBalance).toHaveBeenCalled()
      expect(foreignAssetsPallet.getBalance).toHaveBeenCalledWith(api, '5FMock', asset, customId)
      expect(result).toBe(55n)
    })

    it('throws the last encountered error when every pallet fails', async () => {
      vi.mocked(getOtherAssetsPallets).mockReturnValueOnce(['Tokens'])

      const expectedError = new Error('all failed')
      const failingPallet = {
        getBalance: vi.fn().mockRejectedValue(expectedError)
      }

      vi.mocked(getPalletInstance).mockReturnValueOnce(failingPallet as unknown as BaseAssetsPallet)

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
      const foreignSpy = vi.spyOn(chain, 'getBalanceForeign').mockResolvedValue(0n)

      const result = await chain.getBalance(api, '5FMock', nativeAsset)

      expect(nativeSpy).toHaveBeenCalledWith(api, '5FMock', nativeAsset)
      expect(foreignSpy).not.toHaveBeenCalled()
      expect(result).toBe(11n)
    })

    it('routes non-native assets to getBalanceForeign', async () => {
      const foreignAsset = { symbol: 'USDT' } as TAssetInfo

      const nativeSpy = vi.spyOn(chain, 'getBalanceNative').mockResolvedValue(0n)
      const foreignSpy = vi.spyOn(chain, 'getBalanceForeign').mockResolvedValue(22n)

      const result = await chain.getBalance(api, '5FMock', foreignAsset)

      expect(nativeSpy).not.toHaveBeenCalled()
      expect(foreignSpy).toHaveBeenCalledWith(api, '5FMock', foreignAsset)
      expect(result).toBe(22n)
    })
  })

  describe('mint', () => {
    it('routes the native asset to the native pallet and forwards the chain instance', async () => {
      const palletMock = { mint: vi.fn().mockResolvedValue({ balanceTx: { module: 'Balances' } }) }
      vi.mocked(getPalletInstance).mockReturnValue(palletMock as unknown as BaseAssetsPallet)

      const asset = { symbol: 'DOT', isNative: true, amount: 5n } as WithAmount<TAssetInfo>

      const result = await chain.mint(api, '5FMock', asset, 1n)

      expect(getPalletInstance).toHaveBeenCalledWith('Balances')
      expect(palletMock.mint).toHaveBeenCalledWith(api, '5FMock', asset, 1n, chain)
      expect(result).toEqual({ balanceTx: { module: 'Balances' } })
    })

    it('routes non-native assets to an other-assets pallet', async () => {
      vi.mocked(getOtherAssetsPallets).mockReturnValue(['Tokens'])
      const palletMock = { mint: vi.fn().mockResolvedValue({ balanceTx: { module: 'Tokens' } }) }
      vi.mocked(getPalletInstance).mockReturnValue(palletMock as unknown as BaseAssetsPallet)

      const asset = {
        symbol: 'USDT',
        isNative: false,
        assetId: '1',
        amount: 5n
      } as WithAmount<TAssetInfo>

      await chain.mint(api, '5FMock', asset, 0n)

      expect(getPalletInstance).toHaveBeenCalledWith('Tokens')
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
