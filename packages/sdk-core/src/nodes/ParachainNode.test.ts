import { describe, it, expect, vi, beforeEach } from 'vitest'
import ParachainNode from './ParachainNode'
import { NoXCMSupportImplementedError } from '../errors/NoXCMSupportImplementedError'
import type { TRelayToParaOptions } from '../types'
import {
  Version,
  type TPolkadotXcmSection,
  type TPolkadotXCMTransferOptions,
  type TSendInternalOptions,
  type TXTokensCurrencySelection,
  type TXTokensTransferOptions,
  type TXTransferTransferOptions
} from '../types'
import type { IPolkadotApi } from '../api'

vi.mock('../utils', () => ({
  createApiInstance: vi.fn().mockResolvedValue('apiInstance'),
  generateAddressPayload: vi.fn().mockReturnValue('addressPayload'),
  getFees: vi.fn().mockReturnValue('fees'),
  verifyMultiLocation: vi.fn(),
  isTMultiLocation: vi.fn(),
  isRelayChain: vi.fn()
}))

vi.mock('../pallets/xcmPallet/utils', () => ({
  constructRelayToParaParameters: vi.fn().mockReturnValue('parameters'),
  createCurrencySpec: vi.fn().mockReturnValue('currencySpec'),
  createPolkadotXcmHeader: vi.fn().mockReturnValue('polkadotXcmHeader'),
  isTMultiLocation: vi.fn()
}))

vi.mock('../pallets/assets', () => ({
  getNativeAssetSymbol: vi.fn().mockReturnValue('DOT')
}))

vi.mock('./config', () => ({
  getNodeProviders: vi.fn().mockReturnValue(['provider1', 'provider2']),
  getNodeProvider: vi.fn().mockReturnValue('provider1'),
  getParaId: vi.fn().mockReturnValue(1000)
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
    _section: TPolkadotXcmSection,
    _fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ) {
    return 'transferPolkadotXCM called'
  }

  public exposeCanUseXTokens(options: TSendInternalOptions<unknown, unknown>): boolean {
    return this.canUseXTokens(options)
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
    _section: TPolkadotXcmSection,
    _fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ) {
    return 'transferPolkadotXCM called'
  }
}

class NoSupportNode extends ParachainNode<unknown, unknown> {}

describe('ParachainNode', () => {
  let node: TestParachainNode

  beforeEach(() => {
    node = new TestParachainNode('Acala', 'TestNode', 'polkadot', Version.V3)
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
    expect(node.version).toBe(Version.V3)
  })

  it('should get assetCheckEnabled', () => {
    expect(node.assetCheckEnabled).toBe(true)
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
    const node = new NoXTokensNode('Acala', 'TestNode', 'polkadot', Version.V3)
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

  it('should call transferPolkadotXCM when supportsPolkadotXCM returns true', async () => {
    const node = new OnlyPolkadotXCMNode('Acala', 'TestNode', 'polkadot', Version.V3)
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
    const node = new NoSupportNode('Acala', 'TestNode', 'polkadot', Version.V3)
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

    const node = new TestNode('Acala', 'TestNode', 'polkadot', Version.V3)
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
      destination: 'Polimec'
    } as TSendInternalOptions<unknown, unknown>

    await expect(node.transfer(options)).rejects.toThrowError(
      'Sending assets to Polimec is supported only from AssetHubPolkadot'
    )
  })

  it('should not throw error when destination is Polimec and node is AssetHubPolkadot', async () => {
    const node = new TestParachainNode('AssetHubPolkadot', 'TestNode', 'polkadot', Version.V3)
    node.transferXTokens = vi.fn().mockReturnValue('transferXTokens called')

    const options = {
      api: {},
      asset: { symbol: 'DOT', amount: '100' },
      address: 'destinationAddress',
      destination: 'Polimec'
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
      section: 'reserve_transfer_assets',
      parameters: 'parameters'
    })
  })

  it('should create currency spec', () => {
    const result = node.createCurrencySpec('100', 'ParaToRelay', Version.V3, { symbol: 'DOT' })

    expect(result).toBe('currencySpec')
  })

  it('should create Polkadot XCM header', () => {
    const result = node.createPolkadotXcmHeader('ParaToRelay', Version.V3, 'Polkadot')

    expect(result).toBe('polkadotXcmHeader')
  })

  it('should get native asset symbol', () => {
    expect(node.getNativeAssetSymbol()).toBe('DOT')
  })
})
