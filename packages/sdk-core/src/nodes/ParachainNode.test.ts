import { findAssetByMultiLocation, InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import * as BuilderModule from '../builder'
import { DOT_MULTILOCATION } from '../constants'
import { BridgeHaltedError, InvalidAddressError, NoXCMSupportImplementedError } from '../errors'
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
import ParachainNode from './ParachainNode'

vi.mock('../constants/nodes')

vi.mock('../transfer/getBridgeStatus', () => ({
  getBridgeStatus: vi.fn().mockResolvedValue('Normal')
}))

vi.mock('../utils', () => ({
  createApiInstance: vi.fn().mockResolvedValue('apiInstance'),
  createVersionedBeneficiary: vi.fn().mockReturnValue('addressPayload'),
  getFees: vi.fn().mockReturnValue('fees'),
  verifyMultiLocation: vi.fn(),
  isTMultiLocation: vi.fn(),
  isRelayChain: vi.fn(),
  createBeneficiaryMultiLocation: vi.fn().mockReturnValue('beneficiaryMultiLocation')
}))

vi.mock('../pallets/xcmPallet/utils', async () => {
  const actual = await vi.importActual('../pallets/xcmPallet/utils')
  return {
    ...actual,
    constructRelayToParaParameters: vi.fn().mockReturnValue('parameters'),
    createVersionedMultiAssets: vi.fn().mockReturnValue('currencySpec'),
    createMultiAsset: vi.fn().mockReturnValue('multiAsset'),
    createVersionedDestination: vi.fn().mockReturnValue('polkadotXcmHeader'),
    isTMultiLocation: vi.fn()
  }
})

vi.mock('@paraspell/assets', () => ({
  getNativeAssetSymbol: vi.fn().mockReturnValue('DOT'),
  findAssetByMultiLocation: vi.fn().mockReturnValue({ symbol: 'DOT' }),
  getOtherAssets: vi.fn().mockReturnValue([{ symbol: 'DOT', assetId: '123' }]),
  isForeignAsset: vi.fn().mockReturnValue(true),
  isNodeEvm: vi.fn().mockReturnValue(false),
  InvalidCurrencyError: class extends Error {}
}))

vi.mock('./config', () => ({
  getNodeProviders: vi.fn().mockReturnValue(['provider1', 'provider2']),
  getParaId: vi.fn().mockReturnValue(1000)
}))

vi.mock('../transfer/ethTransfer', () => ({
  getParaEthTransferFees: vi.fn().mockReturnValue('fee')
}))

vi.mock('../utils/ethereum/createCustomXcmOnDest', () => ({
  createCustomXcmOnDest: vi.fn(() => '0xmockedXcm')
}))

vi.mock('../utils/ethereum/generateMessageId', () => ({
  generateMessageId: vi.fn().mockReturnValue('0xmessageId')
}))

class TestParachainNode extends ParachainNode<unknown, unknown> {
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

  public exposeTransferEthAssetViaAH(options: TPolkadotXCMTransferOptions<unknown, unknown>) {
    return this.transferEthAssetViaAH(options)
  }
}

class NoXTokensNode extends ParachainNode<unknown, unknown> {
  transferXTransfer(_input: TXTransferTransferOptions<unknown, unknown>) {
    return 'transferXTransfer called'
  }
}

class OnlyPolkadotXCMNode extends ParachainNode<unknown, unknown> {
  transferPolkadotXCM(
    _options: TPolkadotXCMTransferOptions<unknown, unknown>,
    _method: TPolkadotXcmMethod,
    _fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ) {
    return 'transferPolkadotXCM called'
  }
}

class NoSupportNode extends ParachainNode<unknown, unknown> {}

describe('ParachainNode', () => {
  let node: TestParachainNode

  beforeEach(() => {
    node = new TestParachainNode('Acala', 'TestNode', 'polkadot', Version.V4)
  })

  it('should create an instance', () => {
    expect(node).toBeDefined()
  })

  it('should get the name', () => {
    expect(node.info).toBe('TestNode')
  })

  it('should get the type', () => {
    expect(node.type).toBe('polkadot')
  })

  it('should get the node', () => {
    expect(node.node).toBe('Acala')
  })

  it('should get the version', () => {
    expect(node.version).toBe(Version.V4)
  })

  it('should return true for canUseXTokens when using exposeCanUseXTokens', () => {
    const options = {
      api: {} as IPolkadotApi<unknown, unknown>,
      asset: { symbol: 'DOT', amount: '100' },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>
    expect(node.exposeCanUseXTokens(options)).toBe(true)
  })

  it('should call transferXTokens when supportsXTokens and canUseXTokens return true', async () => {
    const options = {
      api: {},
      asset: { symbol: 'DOT', amount: '100' },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>

    const transferXTokensSpy = vi.spyOn(node, 'transferXTokens')

    const result = await node.transfer(options)

    expect(transferXTokensSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTokens called')
  })

  it('should call transferXTransfer when supportsXTransfer returns true', async () => {
    const node = new NoXTokensNode('Acala', 'TestNode', 'polkadot', Version.V4)
    const options = {
      api: {},
      asset: { symbol: 'DOT', amount: '100' },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>

    const transferXTransferSpy = vi.spyOn(node, 'transferXTransfer')

    const result = await node.transfer(options)

    expect(transferXTransferSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTransfer called')
  })

  it('should fail when transfering to Polimec and node is not AssetHubPolkadot or Hydration', async () => {
    const options = {
      api: {},
      asset: { symbol: 'DOT', amount: '100' },
      address: 'destinationAddress',
      to: 'Polimec'
    } as TSendInternalOptions<unknown, unknown>

    await expect(node.transfer(options)).rejects.toThrowError(
      'Sending assets to Polimec is supported only from AssetHubPolkadot and Hydration'
    )
  })

  it('should call transferPolkadotXCM when supportsPolkadotXCM returns true', async () => {
    const node = new OnlyPolkadotXCMNode('Acala', 'TestNode', 'polkadot', Version.V4)
    const options = {
      api: {},
      asset: { symbol: 'DOT', amount: '100' },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>

    const transferPolkadotXCMSpy = vi.spyOn(node, 'transferPolkadotXCM')

    const result = await node.transfer(options)

    expect(transferPolkadotXCMSpy).toHaveBeenCalled()
    expect(result).toBe('transferPolkadotXCM called')
  })

  it('should throw NoXCMSupportImplementedError when no transfer methods are supported', async () => {
    const node = new NoSupportNode('Acala', 'TestNode', 'polkadot', Version.V4)
    const options = {
      api: {},
      asset: { symbol: 'DOT', amount: '100' },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>

    await expect(node.transfer(options)).rejects.toThrowError(NoXCMSupportImplementedError)
  })

  it('should not call transferXTokens when canUseXTokens returns false', async () => {
    class TestNode extends TestParachainNode {
      protected canUseXTokens(_: TSendInternalOptions<unknown, unknown>): boolean {
        return false
      }
    }

    const node = new TestNode('Acala', 'TestNode', 'polkadot', Version.V4)
    node.transferXTransfer = vi.fn().mockReturnValue('transferXTransfer called')

    const options = {
      api: {},
      asset: { symbol: 'DOT', amount: '100' },
      address: 'destinationAddress'
    } as TSendInternalOptions<unknown, unknown>

    const transferXTokensSpy = vi.spyOn(node, 'transferXTokens')
    const transferXTransferSpy = vi.spyOn(node, 'transferXTransfer')

    const result = await node.transfer(options)

    expect(transferXTokensSpy).not.toHaveBeenCalled()
    expect(transferXTransferSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTransfer called')
  })

  it('should throw error when destination is Polimec and node is not AssetHubPolkadot', async () => {
    const options = {
      api: {},
      asset: { symbol: 'DOT', amount: '100' },
      address: 'destinationAddress',
      to: 'Polimec'
    } as TSendInternalOptions<unknown, unknown>

    await expect(node.transfer(options)).rejects.toThrowError(
      'Sending assets to Polimec is supported only from AssetHubPolkadot'
    )
  })

  it('should not throw error when destination is Polimec and node is AssetHubPolkadot', async () => {
    const node = new TestParachainNode('AssetHubPolkadot', 'TestNode', 'polkadot', Version.V4)
    node.transferXTokens = vi.fn().mockReturnValue('transferXTokens called')

    const options = {
      api: {},
      asset: { symbol: 'DOT', amount: '100' },
      address: 'destinationAddress',
      to: 'Polimec'
    } as TSendInternalOptions<unknown, unknown>

    const transferXTokensSpy = vi.spyOn(node, 'transferXTokens')

    const result = await node.transfer(options)

    expect(transferXTokensSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTokens called')
  })

  it('should return correct API call from transferRelayToPara', () => {
    const options = {} as TRelayToParaOptions<unknown, unknown>

    const result = node.transferRelayToPara(options)

    expect(result).toEqual({
      module: 'XcmPallet',
      method: 'limited_reserve_transfer_assets',
      parameters: 'parameters'
    })
  })

  it('should create currency spec', () => {
    const result = node.createCurrencySpec('100', 'ParaToRelay', Version.V4, {
      symbol: 'DOT',
      isNative: true
    })

    expect(result).toBe('currencySpec')
  })

  it('should create Polkadot XCM header', () => {
    const result = node.createVersionedDestination('ParaToRelay', Version.V4, 'Polkadot')

    expect(result).toBe('polkadotXcmHeader')
  })

  it('should perform transfer to ethereum', async () => {
    const options = {
      api: {
        accountToHex: vi.fn(),
        createApiForNode: vi.fn(),
        callTxMethod: vi.fn(),
        getFromRpc: vi.fn(),
        clone: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>,
      asset: { symbol: 'WETH', assetId: '', multiLocation: {}, amount: '100' },
      senderAddress: '0x456'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const spy = vi.spyOn(options.api, 'callTxMethod')

    vi.mocked(findAssetByMultiLocation).mockReturnValue({ symbol: 'WETH', assetId: '123' })

    await node.exposeTransferToEthereum(options)

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
        createApiForNode: vi.fn(),
        callTxMethod: vi.fn(),
        getFromRpc: vi.fn(),
        clone: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>,
      asset: { symbol: 'WETH', assetId: '', multiLocation: {}, amount: '100' },
      senderAddress: undefined
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await expect(node.exposeTransferToEthereum(options)).rejects.toThrowError(
      'Sender address is required'
    )
  })

  it('should throw if the address is multi-location', async () => {
    const options = {
      api: {
        accountToHex: vi.fn(),
        createApiForNode: vi.fn(),
        callTxMethod: vi.fn(),
        getFromRpc: vi.fn(),
        clone: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>,
      asset: { symbol: 'WETH', assetId: '', multiLocation: {}, amount: '100' },
      senderAddress: '0x456',
      address: DOT_MULTILOCATION
    } as TPolkadotXCMTransferOptions<unknown, unknown>
    await expect(node.exposeTransferToEthereum(options)).rejects.toThrowError(
      'Multi-location address is not supported for Ethereum transfers'
    )
  })

  it('should perform eth asset transfer with deposit asset only instruction', async () => {
    const options = {
      api: {
        accountToHex: vi.fn(),
        createApiForNode: vi.fn(),
        callTxMethod: vi.fn(),
        getFromRpc: vi.fn(),
        clone: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>,
      asset: { symbol: 'WETH', assetId: '', multiLocation: {}, amount: '100' },
      senderAddress: '0x456'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const spy = vi.spyOn(options.api, 'callTxMethod')

    vi.mocked(findAssetByMultiLocation).mockReturnValue({ symbol: 'WETH', assetId: '123' })

    await node.exposeTransferToEthereum(options, true)

    expect(spy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: expect.any(Object)
    })
  })

  describe('transferLocal', () => {
    it('should throw an error if the address is multi-location', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForNode: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        asset: { symbol: 'WETH', assetId: '', multiLocation: {}, amount: '100' },
        senderAddress: '0x456',
        address: DOT_MULTILOCATION
      } as TSendInternalOptions<unknown, unknown>

      expect(() => node.transferLocal(options)).toThrow(InvalidAddressError)
    })

    it('should call transferLocalNativeAsset when asset is native', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForNode: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        asset: { symbol: 'DOT', assetId: '', multiLocation: {}, amount: '100' },
        senderAddress: '0x456',
        address: '0x123'
      } as TSendInternalOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValue(false)

      const transferLocalNativeSpy = vi.spyOn(node, 'transferLocalNativeAsset')

      node.transferLocal(options)

      expect(transferLocalNativeSpy).toHaveBeenCalled()
    })

    it('should call transferLocalNonNativeAsset when asset is foreign', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForNode: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        asset: { symbol: 'WETH', assetId: '', multiLocation: {}, amount: '100' },
        senderAddress: '0x456',
        address: '0x123'
      } as TSendInternalOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValue(true)

      const transferLocalNonNativeSpy = vi.spyOn(node, 'transferLocalNonNativeAsset')

      node.transferLocal(options)

      expect(transferLocalNonNativeSpy).toHaveBeenCalled()
    })
  })

  describe('transferLocalNativeAsset', () => {
    it('should create an API call', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForNode: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        asset: { symbol: 'DOT', assetId: '', multiLocation: {}, amount: '100' },
        senderAddress: '0x456',
        address: '0x123'
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(options.api, 'callTxMethod')

      node.transferLocalNativeAsset(options)

      expect(spy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_keep_alive',
        parameters: {
          dest: { Id: options.address },
          value: BigInt(options.asset.amount)
        }
      })
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw an error if the asset is not foreign', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForNode: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        asset: { symbol: 'DOT', amount: '100' },
        senderAddress: '0x456',
        address: '0x123'
      } as TTransferLocalOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValueOnce(false)

      expect(() => node.transferLocalNonNativeAsset(options)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error if assetId is undefined', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForNode: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        asset: { symbol: 'WETH', assetId: undefined, amount: '100' },
        senderAddress: '0x456',
        address: '0x123'
      } as TTransferLocalOptions<unknown, unknown>

      expect(() => node.transferLocalNonNativeAsset(options)).toThrow(InvalidCurrencyError)
    })

    it('should create an API call', () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForNode: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        asset: { symbol: 'WETH', assetId: '10', multiLocation: {}, amount: '100' },
        senderAddress: '0x456',
        address: '0x123'
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(options.api, 'callTxMethod')

      node.transferLocalNonNativeAsset(options)

      expect(spy).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        parameters: {
          dest: { Id: options.address },
          currency_id: 10n,
          amount: BigInt(options.asset.amount)
        }
      })
    })
  })

  describe('transferEthAssetViaAH', () => {
    const options = {
      api: {
        accountToHex: vi.fn(),
        createApiForNode: vi.fn(),
        callTxMethod: vi.fn(),
        getFromRpc: vi.fn(),
        clone: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>,
      asset: { symbol: 'WETH', assetId: '', multiLocation: {}, amount: '100' },
      senderAddress: '0x456'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    beforeEach(() => {
      const mockBuilderInstance = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        amount: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        senderAddress: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        dryRun: vi.fn().mockResolvedValue({
          origin: {
            success: true,
            fee: 1000n
          }
        })
      } as unknown as BuilderModule.GeneralBuilder<unknown, unknown>

      vi.spyOn(BuilderModule, 'Builder').mockImplementation(() => mockBuilderInstance)
    })

    it('should throw an error if the asset has no multi-location', async () => {
      await expect(
        node.exposeTransferEthAssetViaAH({
          ...options,
          asset: { symbol: 'WETH', assetId: '', multiLocation: undefined, amount: '100' }
        })
      ).rejects.toThrowError(InvalidCurrencyError)
    })

    it('should throw an error if no sender address provided', async () => {
      await expect(
        node.exposeTransferEthAssetViaAH({
          ...options,
          senderAddress: undefined
        })
      ).rejects.toThrowError()
    })

    it('should throw an error if the address is multi-location', async () => {
      await expect(
        node.exposeTransferEthAssetViaAH({
          ...options,
          senderAddress: '0x123',
          address: DOT_MULTILOCATION
        })
      ).rejects.toThrowError()
    })

    it('should throw an error if dry-run fails', async () => {
      const mockBuilderInstance = {
        from: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        amount: vi.fn().mockReturnThis(),
        address: vi.fn().mockReturnThis(),
        currency: vi.fn().mockReturnThis(),
        dryRun: vi.fn().mockResolvedValue({
          origin: {
            success: false,
            failureReason: 'error'
          }
        })
      } as unknown as BuilderModule.GeneralBuilder<unknown, unknown>

      vi.spyOn(BuilderModule, 'Builder').mockImplementation(() => mockBuilderInstance)

      await expect(node.exposeTransferEthAssetViaAH(options)).rejects.toThrowError()
    })

    it('should perform eth asset transfer via AH', async () => {
      const options = {
        api: {
          accountToHex: vi.fn(),
          createApiForNode: vi.fn(),
          callTxMethod: vi.fn(),
          getFromRpc: vi.fn(),
          clone: vi.fn()
        } as unknown as IPolkadotApi<unknown, unknown>,
        asset: { symbol: 'WETH', assetId: '', multiLocation: {}, amount: '100' },
        senderAddress: '0x456'
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const spy = vi.spyOn(options.api, 'callTxMethod')

      vi.mocked(findAssetByMultiLocation).mockReturnValue({ symbol: 'WETH', assetId: '123' })

      await node.exposeTransferEthAssetViaAH(options)

      expect(spy).toHaveBeenCalledWith({
        module: 'PolkadotXcm',
        method: 'transfer_assets_using_type_and_then',
        parameters: expect.any(Object)
      })
    })
  })

  it('should throw BridgeHaltedError when bridge status is not normal', async () => {
    const options = {
      api: {
        accountToHex: vi.fn(),
        createApiForNode: vi.fn(),
        callTxMethod: vi.fn(),
        getFromRpc: vi.fn(),
        clone: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>,
      asset: { symbol: 'WETH', assetId: '', multiLocation: {}, amount: '100' },
      senderAddress: '0x456'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(getBridgeStatus).mockResolvedValue('Halted')

    await expect(node.exposeTransferToEthereum(options)).rejects.toThrowError(BridgeHaltedError)
  })
})
