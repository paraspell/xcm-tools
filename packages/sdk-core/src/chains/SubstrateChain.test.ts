import type { WithAmount } from '@paraspell/assets'
import { InvalidCurrencyError, type TAssetInfo } from '@paraspell/assets'
import { getOtherAssetsPallets } from '@paraspell/pallets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../api'
import type { chains } from '../constants'
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
import type { BaseAssetsPallet, TSerializedExtrinsics, TTransferLocalOptions } from '../types'
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
    isTLocation: vi.fn(),
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

vi.mock('@paraspell/pallets', async () => {
  const actual = await vi.importActual('@paraspell/pallets')
  return {
    ...actual,
    getOtherAssetsPallets: vi.fn()
  }
})

vi.mock('../pallets')

vi.mock('../transfer', () => ({
  createTypeAndThenCall: vi.fn()
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
    accountToHex: vi.fn(),
    createApiForChain: vi.fn(),
    deserializeExtrinsics: vi.fn(),
    getFromRpc: vi.fn(),
    clone: vi.fn(),
    findAssetInfo: vi.fn(),
    findNativeAssetInfoOrThrow: vi.fn().mockReturnValue({ symbol: 'MYTH', location: {} }),
    getParaId: vi.fn().mockReturnValue(1000),
    getNativeAssetSymbol: vi.fn(),
    getRelayChainSymbol: vi.fn().mockReturnValue('DOT'),
    hasPallet: vi.fn().mockReturnValue(false),
    localizeLocation: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  beforeEach(() => {
    chain = new TestParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    vi.spyOn(api, 'getNativeAssetSymbol').mockReturnValue('DOT')
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

  describe('Sending / receiving disabled', () => {
    class SendDisabledParachain extends SubstrateChain<unknown, unknown, unknown> {
      isSendingTempDisabled() {
        return true
      }
    }

    it('should throw if sending is disabled', async () => {
      const chainName = 'Acala'
      const chain = new SendDisabledParachain(chainName, 'TestChain', 'Polkadot', Version.V4)

      const options = {
        api,
        to: 'Astar',
        assetInfo: { symbol: 'DOT', amount: 100n },
        recipient: 'destinationAddress'
      } as TTransferInternalOptions<unknown, unknown, unknown>

      await expect(chain.transfer(options)).rejects.toThrow(
        'Sending from Acala is temporarily disabled'
      )
    })

    it('should throw if receiving is disabled', async () => {
      class ReceiveDisabledParachain extends SubstrateChain<unknown, unknown, unknown> {
        isReceivingTempDisabled() {
          return true
        }

        transferPolkadotXCM() {
          return Promise.resolve('transferPolkadotXCM called')
        }
      }

      const chainName = 'Acala'
      const chain = new ReceiveDisabledParachain(chainName, 'TestChain', 'Polkadot', Version.V4)

      vi.mocked(getChain).mockReturnValue(chain)

      const options = {
        api,
        to: 'Astar',
        assetInfo: { symbol: 'DOT', amount: 100n },
        recipient: 'destinationAddress'
      } as TTransferInternalOptions<unknown, unknown, unknown>

      vi.mocked(resolveDestChain).mockReturnValue('Astar')

      await expect(chain.transfer(options)).rejects.toThrow(
        'Receiving on Astar is temporarily disabled'
      )
    })
  })

  it('throws when relay asset is used and type-and-then is not supported', async () => {
    vi.spyOn(api, 'hasMethod').mockResolvedValue(false)

    const options = {
      api,
      to: 'Astar',
      recipient: 'destinationAddress',
      assetInfo: {
        symbol: 'DOT',
        amount: 100n,
        location: RELAY_LOCATION
      }
    } as TTransferInternalOptions<unknown, unknown, unknown>

    await expect(chain.transfer(options)).rejects.toThrow(TypeAndThenUnavailableError)
  })

  it('should call handleExecuteTransfer if transactOptions.call is specified', async () => {
    const chain = new TestParachain('Acala', 'TestChain', 'Polkadot', Version.V5)
    const options = {
      api,
      to: 'AssetHubPolkadot',
      assetInfo: { symbol: 'DOT', location: DOT_LOCATION, amount: 100n },
      recipient: 'destinationAddress',
      transactOptions: {
        call: '0x01'
      }
    } as TTransferInternalOptions<unknown, unknown, unknown>

    vi.mocked(resolveDestChain).mockReturnValue('AssetHubPolkadot')

    const spy = vi.spyOn(api, 'deserializeExtrinsics')

    await chain.transfer(options)

    expect(handleExecuteTransfer).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: 'execute',
      params: {}
    })
  })

  it('should call handleTransactUsingSend when transactOptions.call is specified and version is < V5', async () => {
    const chain = new TestParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    const options = {
      api,
      to: 'Astar',
      assetInfo: { symbol: 'DOT', location: DOT_LOCATION, amount: 100n },
      recipient: 'destinationAddress',
      transactOptions: {
        call: '0x01'
      },
      version: Version.V4
    } as TTransferInternalOptions<unknown, unknown, unknown>

    vi.mocked(resolveDestChain).mockReturnValue('AssetHubPolkadot')

    const spy = vi.spyOn(api, 'deserializeExtrinsics')

    await chain.transfer(options)

    expect(handleTransactUsingSend).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: 'send',
      params: {}
    })
  })

  it('throws when destination chain cannot receive from origin (canReceiveFrom=false)', async () => {
    const chain = new TestParachain('Acala', 'TestChain', 'Polkadot', Version.V4)

    vi.mocked(resolveDestChain).mockReturnValue('Astar')

    vi.mocked(getChain).mockReturnValue({
      canReceiveFrom: () => false,
      isReceivingTempDisabled: () => false
    } as unknown as ReturnType<typeof chains<unknown, unknown, unknown>>['Acala'])

    const options = {
      api,
      to: 'Astar',
      assetInfo: { symbol: 'DOT', amount: 100n },
      recipient: 'destinationAddress'
    } as TTransferInternalOptions<unknown, unknown, unknown>

    await expect(chain.transfer(options)).rejects.toThrow(ScenarioNotSupportedError)
  })

  it('proceeds when destination chain can receive from origin (canReceiveFrom=true)', async () => {
    const chain = new TestParachain('Acala', 'TestChain', 'Polkadot', Version.V4)

    vi.mocked(resolveDestChain).mockReturnValue('Astar')

    vi.mocked(getChain).mockReturnValue({
      canReceiveFrom: () => true,
      isReceivingTempDisabled: () => false
    } as unknown as ReturnType<typeof chains<unknown, unknown, unknown>>['Acala'])

    const options = {
      api,
      to: 'Astar',
      assetInfo: { symbol: 'DOT', amount: 100n, location: DOT_LOCATION },
      recipient: 'destinationAddress'
    } as TTransferInternalOptions<unknown, unknown, unknown>

    const spy = vi.spyOn(chain, 'transferPolkadotXCM')

    const result = await chain.transfer(options)

    expect(spy).toHaveBeenCalled()
    expect(result).toBe('transferPolkadotXCM called')
  })

  it('should call transferPolkadotXCM when supportsPolkadotXCM returns true', async () => {
    const chain = new OnlyPolkadotXCMParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    const options = {
      api,
      to: 'Astar',
      assetInfo: {
        symbol: 'ASTR',
        amount: 100n,
        location: {
          parents: 1,
          interior: { X1: { Parachain: 2000 } }
        }
      },
      recipient: 'destinationAddress'
    } as TTransferInternalOptions<unknown, unknown, unknown>

    const transferPolkadotXCMSpy = vi.spyOn(chain, 'transferPolkadotXCM')

    const result = await chain.transfer(options)

    expect(transferPolkadotXCMSpy).toHaveBeenCalled()
    expect(result).toBe('transferPolkadotXCM called')
  })

  it('routes to limited_teleport_assets when native asset teleport to/from AssetHub applies', async () => {
    vi.mocked(isNativeAssetTeleport).mockReturnValue(true)

    const chain = new OnlyPolkadotXCMParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    const options = {
      api,
      to: 'AssetHubPolkadot',
      assetInfo: {
        symbol: 'ASTR',
        amount: 100n,
        location: {
          parents: 1,
          interior: { X1: { Parachain: 2000 } }
        }
      },
      recipient: 'destinationAddress'
    } as TTransferInternalOptions<unknown, unknown, unknown>

    vi.mocked(resolveDestChain).mockReturnValue('AssetHubPolkadot')

    const transferPolkadotXCMSpy = vi.spyOn(chain, 'transferPolkadotXCM')

    await chain.transfer(options)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      expect.anything(),
      'limited_teleport_assets',
      'Unlimited'
    )
    expect(transferPolkadotXCMSpy).not.toHaveBeenCalled()
  })

  it('skips limited_teleport_assets and uses transferPolkadotXCM when execute transfer is required', async () => {
    vi.mocked(isNativeAssetTeleport).mockReturnValue(true)

    const chain = new ExecuteTransferParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    const options = {
      api,
      to: 'AssetHubPolkadot',
      assetInfo: {
        symbol: 'ASTR',
        amount: 100n,
        location: {
          parents: 1,
          interior: { X1: { Parachain: 2000 } }
        }
      },
      recipient: 'destinationAddress'
    } as TTransferInternalOptions<unknown, unknown, unknown>

    vi.mocked(resolveDestChain).mockReturnValue('AssetHubPolkadot')
    vi.mocked(transferPolkadotXcm).mockClear()

    const transferPolkadotXCMSpy = vi.spyOn(chain, 'transferPolkadotXCM')

    await chain.transfer(options)

    expect(transferPolkadotXcm).not.toHaveBeenCalledWith(
      expect.anything(),
      'limited_teleport_assets',
      'Unlimited'
    )
    expect(transferPolkadotXCMSpy).toHaveBeenCalled()
  })

  it('uses type-and-then call for external asset routed via AssetHub', async () => {
    const chain = new OnlyPolkadotXCMParachain('Acala', 'TestChain', 'Polkadot', Version.V4)

    const mockCall: TSerializedExtrinsics = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      params: {}
    }

    vi.mocked(createTypeAndThenCall).mockResolvedValue(mockCall)
    vi.mocked(resolveDestChain).mockReturnValue('Moonbeam')

    const hasMethodSpy = vi.spyOn(api, 'hasMethod').mockResolvedValue(true)
    const deserializeExtrinsicsSpy = vi
      .spyOn(api, 'deserializeExtrinsics')
      .mockResolvedValue('callResult')

    const options = {
      api,
      to: 'Moonbeam',
      assetInfo: {
        symbol: 'USDT',
        amount: 100n,
        location: {
          parents: 2,
          interior: { X1: [{ Parachain: 1000 }] }
        }
      },
      recipient: 'destinationAddress',
      sender: '5FMockSender',
      version: Version.V4,
      paraIdTo: 2004
    } as TTransferInternalOptions<unknown, unknown, unknown>

    const result = await chain.transfer(options)

    expect(hasMethodSpy).toHaveBeenCalled()
    expect(createTypeAndThenCall).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: 'Acala',
        assetInfo: options.assetInfo,
        destination: options.to
      })
    )
    expect(deserializeExtrinsicsSpy).toHaveBeenCalledWith(mockCall)
    expect(result).toBe('callResult')
  })

  it('should throw NoXCMSupportImplementedError when no transfer methods are supported', async () => {
    const chain = new NoSupportParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    const options = {
      api,
      to: 'Astar',
      assetInfo: { symbol: 'DOT', amount: 100n },
      recipient: 'destinationAddress'
    } as TTransferInternalOptions<unknown, unknown, unknown>

    await expect(chain.transfer(options)).rejects.toThrow(NoXCMSupportImplementedError)
  })

  it('should create xcm asset', () => {
    const result = chain.createAsset(
      api,
      {
        symbol: 'DOT',
        decimals: 10,
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
