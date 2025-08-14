import {
  findAssetInfoByLoc,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  isForeignAsset
} from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import { DOT_LOCATION } from '../constants'
import {
  BridgeHaltedError,
  InvalidAddressError,
  NoXCMSupportImplementedError,
  TransferToAhNotSupported
} from '../errors'
import { getBridgeStatus } from '../transfer/getBridgeStatus'
import type { TRelayToParaOptions, TTransferLocalOptions } from '../types'
import {
  type TPolkadotXcmMethod,
  type TPolkadotXCMTransferOptions,
  type TSendInternalOptions,
  type TXTokensCurrencySelection,
  type TXTokensTransferOptions,
  type TXTransferTransferOptions
} from '../types'
import Parachain from './Parachain'

vi.mock('../constants/chains')

vi.mock('../transfer/getBridgeStatus', () => ({
  getBridgeStatus: vi.fn().mockResolvedValue('Normal')
}))

vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils')
  return {
    ...actual,
    createApiInstance: vi.fn().mockResolvedValue('apiInstance'),
    getFees: vi.fn().mockReturnValue('fees'),
    isTLocation: vi.fn(),
    createBeneficiaryLocation: vi.fn().mockReturnValue('beneficiaryLocation'),
    getRelayChainOf: vi.fn().mockReturnValue('Polkadot')
  }
})

vi.mock('../pallets/xcmPallet/utils', async () => {
  const actual = await vi.importActual('../pallets/xcmPallet/utils')
  return {
    ...actual,
    constructRelayToParaParameters: vi.fn().mockReturnValue('parameters'),
    createVersionedDestination: vi.fn().mockReturnValue('polkadotXcmHeader'),
    createDestination: vi.fn()
  }
})

vi.mock('../utils/asset', () => ({
  createAsset: vi.fn().mockReturnValue('asset'),
  createVersionedAssets: vi.fn().mockReturnValue('currencySpec')
}))

vi.mock('@paraspell/assets', async () => {
  const actual = await vi.importActual('@paraspell/assets')
  return {
    ...actual,
    getNativeAssetSymbol: vi.fn().mockReturnValue('DOT'),
    findAssetInfoByLoc: vi.fn().mockReturnValue({ symbol: 'DOT' }),
    getOtherAssets: vi.fn().mockReturnValue([{ symbol: 'DOT', assetId: '123' }]),
    isForeignAsset: vi.fn().mockReturnValue(true),
    isChainEvm: vi.fn().mockReturnValue(false),
    InvalidCurrencyError: class extends Error {}
  }
})

vi.mock('./config', () => ({
  getChainProviders: vi.fn().mockReturnValue(['provider1', 'provider2']),
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

class TestParachain extends Parachain<unknown, unknown> {
  transferXTokens(
    _input: TXTokensTransferOptions<unknown, unknown>,
    _currencySelection: TXTokensCurrencySelection,
    _fees: string | number = 'Unlimited'
  ) {
    return 'transferXTokens called'
  }

  transferXTransfer(_input: TXTransferTransferOptions<unknown, unknown>) {
    return 'transferXTransfer called'
  }

  transferPolkadotXCM(
    _options: TPolkadotXCMTransferOptions<unknown, unknown>,
    _method: TPolkadotXcmMethod,
    _fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ) {
    return 'transferPolkadotXCM called'
  }

  public exposeCanUseXTokens(options: TSendInternalOptions<unknown, unknown>): boolean {
    return this.canUseXTokens(options)
  }

  public exposeTransferToEthereum(
    options: TPolkadotXCMTransferOptions<unknown, unknown>,
    useOnlyDepositAsset = false
  ) {
    return this.transferToEthereum(options, useOnlyDepositAsset)
  }
}

class NoXTokensParachain extends Parachain<unknown, unknown> {
  transferXTransfer(_input: TXTransferTransferOptions<unknown, unknown>) {
    return 'transferXTransfer called'
  }
}

class OnlyPolkadotXCMParachain extends Parachain<unknown, unknown> {
  transferPolkadotXCM(
    _options: TPolkadotXCMTransferOptions<unknown, unknown>,
    _method: TPolkadotXcmMethod,
    _fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ) {
    return 'transferPolkadotXCM called'
  }
}

class NoSupportParachain extends Parachain<unknown, unknown> {}

describe('Parachain', () => {
  let chain: TestParachain

  beforeEach(() => {
    chain = new TestParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
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

  it('should return true for canUseXTokens when using exposeCanUseXTokens', () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    const options = {
      api: {} as IPolkadotApi<unknown, unknown>,
      to: 'Astar',
      assetInfo: { symbol: 'DOT', amount: 100n },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>
    expect(chain.exposeCanUseXTokens(options)).toBe(true)
  })

  it('should call transferXTokens when supportsXTokens and canUseXTokens return true', async () => {
    const options = {
      api: {},
      to: 'Astar',
      assetInfo: { symbol: 'DOT', amount: 100n },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>

    const transferXTokensSpy = vi.spyOn(chain, 'transferXTokens')

    const result = await chain.transfer(options)

    expect(transferXTokensSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTokens called')
  })

  it('should throw error when native asset transfer to AssetHub requires teleport', async () => {
    class NativeTeleportChain extends Parachain<unknown, unknown> {
      transferPolkadotXCM(
        _options: TPolkadotXCMTransferOptions<unknown, unknown>,
        _method: TPolkadotXcmMethod,
        _fees: 'Unlimited' | { Limited: string } | undefined = undefined
      ) {
        return 'transferPolkadotXCM called'
      }

      shouldUseNativeAssetTeleport(_options: TSendInternalOptions<unknown, unknown>): boolean {
        return true
      }
    }

    const chain = new NativeTeleportChain('Acala', 'TestChain', 'Polkadot', Version.V4)

    const options = {
      api: {},
      to: 'AssetHubPolkadot',
      assetInfo: {
        symbol: 'DOT',
        amount: 100n,
        location: { parents: 1, interior: 'Here' }
      },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>

    await expect(chain.transfer(options)).rejects.toThrow(TransferToAhNotSupported)
    await expect(chain.transfer(options)).rejects.toThrow(
      'Native asset transfers to or from AssetHub are temporarily disabled'
    )
  })

  it('should call transferXTransfer when supportsXTransfer returns true', async () => {
    const chain = new NoXTokensParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    const options = {
      api: {},
      to: 'Astar',
      assetInfo: { symbol: 'DOT', amount: 100n },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>

    const transferXTransferSpy = vi.spyOn(chain, 'transferXTransfer')

    const result = await chain.transfer(options)

    expect(transferXTransferSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTransfer called')
  })

  it('should fail when transfering to Polimec and chain is not AssetHubPolkadot or Hydration', async () => {
    const options = {
      api: {},
      assetInfo: { symbol: 'DOT', amount: 100n },
      address: 'destinationAddress',
      to: 'Polimec'
    } as TSendInternalOptions<unknown, unknown>

    await expect(chain.transfer(options)).rejects.toThrowError(
      'Sending assets to Polimec is supported only from AssetHubPolkadot and Hydration'
    )
  })

  it('should call transferPolkadotXCM when supportsPolkadotXCM returns true', async () => {
    const chain = new OnlyPolkadotXCMParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    const options = {
      api: {},
      to: 'Astar',
      assetInfo: { symbol: 'DOT', amount: 100n },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>

    const transferPolkadotXCMSpy = vi.spyOn(chain, 'transferPolkadotXCM')

    const result = await chain.transfer(options)

    expect(transferPolkadotXCMSpy).toHaveBeenCalled()
    expect(result).toBe('transferPolkadotXCM called')
  })

  it('should throw NoXCMSupportImplementedError when no transfer methods are supported', async () => {
    const chain = new NoSupportParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    const options = {
      api: {},
      to: 'Astar',
      assetInfo: { symbol: 'DOT', amount: 100n },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>

    await expect(chain.transfer(options)).rejects.toThrowError(NoXCMSupportImplementedError)
  })

  it('should not call transferXTokens when canUseXTokens returns false', async () => {
    class SomeParachain extends TestParachain {
      canUseXTokens(_: TSendInternalOptions<unknown, unknown>): boolean {
        return false
      }
    }

    const chain = new SomeParachain('Acala', 'TestChain', 'Polkadot', Version.V4)
    chain.transferXTransfer = vi.fn().mockReturnValue('transferXTransfer called')

    const options = {
      api: {},
      assetInfo: { symbol: 'DOT', amount: 100n },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>

    const transferXTokensSpy = vi.spyOn(chain, 'transferXTokens')
    const transferXTransferSpy = vi.spyOn(chain, 'transferXTransfer')

    const result = await chain.transfer(options)

    expect(transferXTokensSpy).not.toHaveBeenCalled()
    expect(transferXTransferSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTransfer called')
  })

  it('should throw error when destination is Polimec and chain is not AssetHubPolkadot', async () => {
    const options = {
      api: {},
      assetInfo: { symbol: 'DOT', amount: 100n },
      address: 'destinationAddress',
      to: 'Polimec'
    } as TSendInternalOptions<unknown, unknown>

    await expect(chain.transfer(options)).rejects.toThrowError(
      'Sending assets to Polimec is supported only from AssetHubPolkadot'
    )
  })

  it('should not throw error when destination is Polimec and chain is AssetHubPolkadot', async () => {
    const chain = new TestParachain('AssetHubPolkadot', 'TestChain', 'Polkadot', Version.V4)
    chain.transferXTokens = vi.fn().mockReturnValue('transferXTokens called')
    const options = {
      api: {},
      assetInfo: { symbol: 'PLMC', amount: 100n },
      address: 'destinationAddress',
      to: 'Polimec'
    } as TSendInternalOptions<unknown, unknown>

    const transferXTokensSpy = vi.spyOn(chain, 'transferXTokens')

    const result = await chain.transfer(options)

    expect(transferXTokensSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTokens called')
  })

  it('should return correct API call from transferRelayToPara', () => {
    const options = {} as TRelayToParaOptions<unknown, unknown>

    const result = chain.transferRelayToPara(options)

    expect(result).toEqual({
      module: 'XcmPallet',
      method: 'limited_reserve_transfer_assets',
      parameters: 'parameters'
    })
  })

  it('should create currency spec', () => {
    const result = chain.createCurrencySpec(100n, 'ParaToRelay', Version.V4, {
      symbol: 'DOT',
      decimals: 10,
      isNative: true
    })

    expect(result).toBe('asset')
  })

  it('should perform transfer to ethereum', async () => {
    const options = {
      api: {
        accountToHex: vi.fn(),
        createApiForChain: vi.fn(),
        callTxMethod: vi.fn(),
        getFromRpc: vi.fn(),
        clone: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>,
      assetInfo: { symbol: 'WETH', assetId: '', location: {}, amount: 100n },
      senderAddress: '0x456'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const spy = vi.spyOn(options.api, 'callTxMethod')

    vi.mocked(findAssetInfoByLoc).mockReturnValue({ symbol: 'WETH', assetId: '123', decimals: 18 })

    await chain.exposeTransferToEthereum(options)

    expect(spy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: expect.any(Object)
    })
  })

  it('should throw if senderAddress is not provided', async () => {
    const options = {
      api: {
        accountToHex: vi.fn(),
        createApiForChain: vi.fn(),
        callTxMethod: vi.fn(),
        getFromRpc: vi.fn(),
        clone: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>,
      assetInfo: { symbol: 'WETH', assetId: '', location: {}, amount: 100n },
      senderAddress: undefined
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await expect(chain.exposeTransferToEthereum(options)).rejects.toThrowError(
      'Sender address is required'
    )
  })

  it('should throw if the address is location', async () => {
    const options = {
      api: {
        accountToHex: vi.fn(),
        createApiForChain: vi.fn(),
        callTxMethod: vi.fn(),
        getFromRpc: vi.fn(),
        clone: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>,
      assetInfo: { symbol: 'WETH', assetId: '', location: {}, amount: 100n },
      senderAddress: '0x456',
      address: DOT_LOCATION
    } as TPolkadotXCMTransferOptions<unknown, unknown>
    await expect(chain.exposeTransferToEthereum(options)).rejects.toThrowError(
      'Location address is not supported for this transfer type.'
    )
  })

  describe('transferLocal', () => {
    it('should throw an error if the address is location', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForChain: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        assetInfo: { symbol: 'WETH', assetId: '', location: {}, amount: 100n },
        senderAddress: '0x456',
        address: DOT_LOCATION
      } as TSendInternalOptions<unknown, unknown>

      expect(() => chain.transferLocal(options)).toThrow(InvalidAddressError)
    })

    it('should call transferLocalNativeAsset when asset is native', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForChain: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        assetInfo: { symbol: 'DOT', assetId: '', location: {}, amount: 100n },
        senderAddress: '0x456',
        address: '0x123'
      } as TSendInternalOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValue(false)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

      const transferLocalNativeSpy = vi.spyOn(chain, 'transferLocalNativeAsset')

      chain.transferLocal(options)

      expect(transferLocalNativeSpy).toHaveBeenCalled()
    })

    it('should call transferLocalNonNativeAsset when asset is foreign', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForChain: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        assetInfo: { symbol: 'WETH', assetId: '', location: {}, amount: 100n },
        senderAddress: '0x456',
        address: '0x123'
      } as TSendInternalOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValue(true)

      const transferLocalNonNativeSpy = vi.spyOn(chain, 'transferLocalNonNativeAsset')

      chain.transferLocal(options)

      expect(transferLocalNonNativeSpy).toHaveBeenCalled()
    })
  })

  describe('transferLocalNativeAsset', () => {
    it('should create an API call', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForChain: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        assetInfo: { symbol: 'DOT', assetId: '', location: {}, amount: 100n },
        senderAddress: '0x456',
        address: '0x123'
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(options.api, 'callTxMethod')

      chain.transferLocalNativeAsset(options)

      expect(spy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_keep_alive',
        parameters: {
          dest: { Id: options.address },
          value: BigInt(options.assetInfo.amount)
        }
      })
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw an error if the asset is not foreign', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForChain: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        assetInfo: { symbol: 'DOT', amount: 100n },
        senderAddress: '0x456',
        address: '0x123'
      } as TTransferLocalOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValueOnce(false)

      expect(() => chain.transferLocalNonNativeAsset(options)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error if assetId is undefined', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForChain: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        assetInfo: { symbol: 'WETH', assetId: undefined, amount: 100n },
        senderAddress: '0x456',
        address: '0x123'
      } as TTransferLocalOptions<unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(options)).toThrow(InvalidCurrencyError)
    })

    it('should create an API call', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForChain: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        assetInfo: { symbol: 'WETH', assetId: '10', location: {}, amount: 100n },
        senderAddress: '0x456',
        address: '0x123'
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(options.api, 'callTxMethod')

      chain.transferLocalNonNativeAsset(options)

      expect(spy).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        parameters: {
          dest: { Id: options.address },
          currency_id: 10n,
          amount: BigInt(options.assetInfo.amount)
        }
      })
    })
  })

  it('should throw BridgeHaltedError when bridge status is not normal', async () => {
    const options = {
      api: {
        accountToHex: vi.fn(),
        createApiForChain: vi.fn(),
        callTxMethod: vi.fn(),
        getFromRpc: vi.fn(),
        clone: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>,
      assetInfo: { symbol: 'WETH', assetId: '', location: {}, amount: 100n },
      senderAddress: '0x456'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(getBridgeStatus).mockResolvedValue('Halted')

    await expect(chain.exposeTransferToEthereum(options)).rejects.toThrowError(BridgeHaltedError)
  })
})
