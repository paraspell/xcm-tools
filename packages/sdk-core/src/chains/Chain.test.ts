import type { WithAmount } from '@paraspell/assets'
import {
  findAssetInfoByLoc,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  type TAssetInfo
} from '@paraspell/assets'
import { getOtherAssetsPallets } from '@paraspell/pallets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import type { chains } from '../constants'
import { DOT_LOCATION, RELAY_LOCATION } from '../constants'
import {
  BridgeHaltedError,
  InvalidAddressError,
  NoXCMSupportImplementedError,
  RoutingResolutionError,
  ScenarioNotSupportedError,
  TransferToAhNotSupported,
  TypeAndThenUnavailableError,
  UnsupportedOperationError
} from '../errors'
import { getPalletInstance } from '../pallets'
import { handleTransactUsingSend } from '../pallets/polkadotXcm'
import { createTypeAndThenCall } from '../transfer'
import { getBridgeStatus } from '../transfer/getBridgeStatus'
import type { BaseAssetsPallet, TSerializedExtrinsics, TTransferLocalOptions } from '../types'
import { type TPolkadotXCMTransferOptions, type TSendInternalOptions } from '../types'
import { getChain, handleExecuteTransfer, resolveDestChain } from '../utils'
import Chain from './Chain'

vi.mock('../constants/chains')
vi.mock('../utils/location')

vi.mock('../transfer/getBridgeStatus', () => ({
  getBridgeStatus: vi.fn().mockResolvedValue('Normal')
}))

vi.mock('../pallets/polkadotXcm')

vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils')
  return {
    ...actual,
    createApiInstance: vi.fn().mockResolvedValue('apiInstance'),
    isTLocation: vi.fn(),
    createBeneficiaryLocation: vi.fn().mockReturnValue('beneficiaryLocation'),
    getRelayChainOf: vi.fn().mockReturnValue('Polkadot'),
    resolveDestChain: vi.fn(),
    handleExecuteTransfer: vi.fn(),
    getChain: vi.fn()
  }
})

vi.mock('../utils/asset', () => ({
  createAsset: vi.fn().mockReturnValue('asset')
}))

vi.mock('@paraspell/pallets', async () => {
  const actual = await vi.importActual('@paraspell/pallets')
  return {
    ...actual,
    getOtherAssetsPallets: vi.fn()
  }
})

vi.mock('@paraspell/assets', async () => {
  const actual = await vi.importActual('@paraspell/assets')
  return {
    ...actual,
    getNativeAssetSymbol: vi.fn().mockReturnValue('DOT'),
    findAssetInfoByLoc: vi.fn().mockReturnValue({ symbol: 'DOT' })
  }
})

vi.mock('../pallets')

vi.mock('./config', () => ({
  getParaId: vi.fn().mockReturnValue(1000)
}))

vi.mock('../transfer', () => ({
  createTypeAndThenCall: vi.fn(),
  getParaEthTransferFees: vi.fn().mockReturnValue('fee')
}))

vi.mock('../utils/ethereum/createCustomXcmOnDest', () => ({
  createCustomXcmOnDest: vi.fn(() => '0xmockedXcm')
}))

vi.mock('../utils/ethereum/generateMessageId', () => ({
  generateMessageId: vi.fn().mockReturnValue('0xmessageId')
}))

class TestParachainBase extends Chain<unknown, unknown, unknown> {
  throwIfTempDisabled() {}
}

class TestParachain extends TestParachainBase {
  transferXTokens() {
    return 'transferXTokens called'
  }

  transferXTransfer() {
    return 'transferXTransfer called'
  }

  transferPolkadotXCM() {
    return 'transferPolkadotXCM called'
  }

  public exposeTransferToEthereum(
    options: TPolkadotXCMTransferOptions<unknown, unknown, unknown>,
    useOnlyDepositAsset = false
  ) {
    return this.transferToEthereum(options, useOnlyDepositAsset)
  }
}

class NoXTokensParachain extends TestParachainBase {
  transferXTransfer() {
    return 'transferXTransfer called'
  }
}

class OnlyPolkadotXCMParachain extends TestParachainBase {
  transferPolkadotXCM() {
    return 'transferPolkadotXCM called'
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
    clone: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown, unknown>

  beforeEach(() => {
    chain = new TestParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
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
    class SendDisabledParachain extends Chain<unknown, unknown, unknown> {
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
        address: 'destinationAddress'
      } as TSendInternalOptions<unknown, unknown, unknown>

      await expect(chain.transfer(options)).rejects.toThrow(
        'Sending from Acala is temporarily disabled'
      )
    })

    it('should throw if receiving is disabled', async () => {
      class ReceiveDisabledParachain extends Chain<unknown, unknown, unknown> {
        isReceivingTempDisabled() {
          return true
        }
      }

      const chainName = 'Acala'
      const chain = new ReceiveDisabledParachain(chainName, 'TestChain', 'Polkadot', Version.V4)

      vi.mocked(getChain).mockReturnValue(
        chain as unknown as ReturnType<typeof chains<unknown, unknown, unknown>>['Acala']
      )

      const options = {
        api,
        to: 'Astar',
        assetInfo: { symbol: 'DOT', amount: 100n },
        address: 'destinationAddress'
      } as TSendInternalOptions<unknown, unknown, unknown>

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
      address: 'destinationAddress',
      assetInfo: {
        symbol: 'DOT',
        amount: 100n,
        location: RELAY_LOCATION
      }
    } as TSendInternalOptions<unknown, unknown, unknown>

    await expect(chain.transfer(options)).rejects.toThrow(TypeAndThenUnavailableError)
  })

  it('should throw error when native asset transfer to AssetHub requires teleport', async () => {
    class NativeTeleportChain extends TestParachainBase {
      transferPolkadotXCM() {
        return 'transferPolkadotXCM called'
      }

      shouldUseNativeAssetTeleport() {
        return true
      }
    }

    const chain = new NativeTeleportChain('Acala', 'TestChain', 'Polkadot', Version.V4)

    const options = {
      api,
      assetInfo: {
        symbol: 'DOT',
        amount: 100n,
        location: { parents: 1, interior: 'Here' }
      },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown, unknown>

    vi.mocked(resolveDestChain).mockReturnValue('AssetHubPolkadot')

    await expect(chain.transfer(options)).rejects.toThrow(TransferToAhNotSupported)
    await expect(chain.transfer(options)).rejects.toThrow(
      'Native asset transfers to or from AssetHub are temporarily disabled'
    )
  })

  it('should call handleExecuteTransfer if transactOptions.call is specified', async () => {
    const chain = new TestParachain('Acala', 'TestChain', 'Polkadot', Version.V5)
    const options = {
      api,
      to: 'AssetHubPolkadot',
      assetInfo: { symbol: 'DOT', location: DOT_LOCATION, amount: 100n },
      address: 'destinationAddress',
      transactOptions: {
        call: '0x01'
      }
    } as TSendInternalOptions<unknown, unknown, unknown>

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
      address: 'destinationAddress',
      transactOptions: {
        call: '0x01'
      },
      version: Version.V4
    } as TSendInternalOptions<unknown, unknown, unknown>

    const spy = vi.spyOn(api, 'deserializeExtrinsics')

    await chain.transfer(options)

    expect(handleTransactUsingSend).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: 'send',
      params: {}
    })
  })

  it('should call transferXTransfer when supportsXTransfer returns true', async () => {
    const chain = new NoXTokensParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    const options = {
      api,
      to: 'Astar',
      assetInfo: { symbol: 'DOT', amount: 100n },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown, unknown>

    const transferXTransferSpy = vi.spyOn(chain, 'transferXTransfer')

    const result = await chain.transfer(options)

    expect(transferXTransferSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTransfer called')
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
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown, unknown>

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
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown, unknown>

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
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown, unknown>

    const transferPolkadotXCMSpy = vi.spyOn(chain, 'transferPolkadotXCM')

    const result = await chain.transfer(options)

    expect(transferPolkadotXCMSpy).toHaveBeenCalled()
    expect(result).toBe('transferPolkadotXCM called')
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
      address: 'destinationAddress',
      senderAddress: '5FMockSender',
      version: Version.V4,
      paraIdTo: 2004
    } as TSendInternalOptions<unknown, unknown, unknown>

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
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown, unknown>

    await expect(chain.transfer(options)).rejects.toThrow(NoXCMSupportImplementedError)
  })

  it('should create xcm asset', () => {
    const result = chain.createAsset(
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

  it('should perform transfer to ethereum', async () => {
    const options = {
      api,
      assetInfo: { symbol: 'WETH', assetId: '', location: {}, amount: 100n },
      senderAddress: '0x456'
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    const spy = vi.spyOn(options.api, 'deserializeExtrinsics')

    vi.mocked(findAssetInfoByLoc).mockReturnValue({ symbol: 'WETH', assetId: '123', decimals: 18 })

    await chain.exposeTransferToEthereum(options)

    expect(spy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      params: expect.any(Object)
    })
  })

  it('should throw if the address is location', async () => {
    const options = {
      api,
      assetInfo: { symbol: 'WETH', assetId: '', location: {}, amount: 100n },
      senderAddress: '0x456',
      address: DOT_LOCATION
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>
    await expect(chain.exposeTransferToEthereum(options)).rejects.toThrow(
      'Location address is not supported for this transfer type.'
    )
  })

  describe('transferLocal', () => {
    it('should throw an error if the address is location', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: '', location: {}, amount: 100n },
        senderAddress: '0x456',
        address: DOT_LOCATION
      } as TSendInternalOptions<unknown, unknown, unknown>

      await expect(chain.transferLocal(options)).rejects.toThrow(InvalidAddressError)
    })

    it('should throw an error when fee asset is provided', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'DOT', amount: 100n, decimals: 10 },
        senderAddress: '0x456',
        address: '0x123',
        feeAsset: { symbol: 'USDT', decimals: 12, assetId: '1', isFeeAsset: true },
        to: 'Acala',
        currency: { symbol: 'DOT', amount: 100n },
        version: Version.V4,
        isAmountAll: false
      } as TSendInternalOptions<unknown, unknown, unknown>

      await expect(chain.transferLocal(options)).rejects.toThrow(UnsupportedOperationError)
    })

    it('should call transferLocalNativeAsset when asset is native', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'DOT', isNative: true, location: {}, amount: 100n },
        senderAddress: '0x456',
        address: '0x123'
      } as TSendInternalOptions<unknown, unknown, unknown>

      vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

      const transferLocalNativeSpy = vi.spyOn(chain, 'transferLocalNativeAsset')

      await chain.transferLocal(options)

      expect(transferLocalNativeSpy).toHaveBeenCalled()
    })

    it('should call transferLocalNonNativeAsset when asset is foreign', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: '123', amount: 100n },
        senderAddress: '0x456',
        address: '0x123'
      } as TSendInternalOptions<unknown, unknown, unknown>

      const transferLocalNonNativeSpy = vi.spyOn(chain, 'transferLocalNonNativeAsset')

      await chain.transferLocal(options)

      expect(transferLocalNonNativeSpy).toHaveBeenCalled()
    })
  })

  describe('transferLocalNativeAsset', () => {
    it('should create an API call', async () => {
      const options = {
        api,
        assetInfo: { symbol: 'DOT', assetId: '', location: {}, amount: 100n },
        senderAddress: '0x456',
        address: '0x123',
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(options.api, 'deserializeExtrinsics')

      await chain.transferLocalNativeAsset(options)

      expect(spy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_allow_death',
        params: {
          dest: { Id: options.address },
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
        senderAddress: '0x456',
        address: '0x123'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(options)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error if assetId is undefined', () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: undefined, amount: 100n },
        senderAddress: '0x456',
        address: '0x123'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(options)).toThrow(InvalidCurrencyError)
    })

    it('should create an API call', () => {
      const options = {
        api,
        assetInfo: { symbol: 'WETH', assetId: '10', location: {}, amount: 100n },
        senderAddress: '0x456',
        address: '0x123'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(options.api, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(options)

      expect(spy).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        params: {
          dest: { Id: options.address },
          currency_id: 10n,
          amount: BigInt(options.assetInfo.amount)
        }
      })
    })
  })

  describe('getCustomCurrencyId', () => {
    it('returns undefined by default', () => {
      const dummyAsset = { symbol: 'USDT' } as TAssetInfo
      expect(chain.getCustomCurrencyId(dummyAsset)).toBeUndefined()
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

  it('should throw BridgeHaltedError when bridge status is not normal', async () => {
    const options = {
      api,
      assetInfo: { symbol: 'WETH', assetId: '', location: {}, amount: 100n },
      senderAddress: '0x456'
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    vi.mocked(getBridgeStatus).mockResolvedValue('Halted')

    await expect(chain.exposeTransferToEthereum(options)).rejects.toThrow(BridgeHaltedError)
  })
})
