import { describe, it, expect, vi, beforeEach } from 'vitest'
import ParachainNode from './ParachainNode'
import { NoXCMSupportImplementedError } from '../errors/NoXCMSupportImplementedError'
import { InvalidCurrencyError } from '../errors'
import * as utils from '../utils'
import * as xcmUtils from '../pallets/xcmPallet/utils'
import type { TRelayToParaOptions } from '../types'
import {
  Version,
  type PolkadotXcmSection,
  type PolkadotXCMTransferInput,
  type TSendInternalOptions,
  type TXTokensCurrencySelection,
  type XTokensTransferInput,
  type XTransferTransferInput
} from '../types'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../pjs/types'
import type { IPolkadotApi } from '../api'

vi.mock('../utils', () => ({
  getAllNodeProviders: vi.fn().mockReturnValue(['provider1']),
  createApiInstance: vi.fn().mockResolvedValue('apiInstance'),
  generateAddressPayload: vi.fn().mockReturnValue('addressPayload'),
  getFees: vi.fn().mockReturnValue('fees'),
  verifyMultiLocation: vi.fn()
}))

vi.mock('../pallets/xcmPallet/utils', () => ({
  constructRelayToParaParameters: vi.fn().mockReturnValue('parameters'),
  createCurrencySpec: vi.fn().mockReturnValue('currencySpec'),
  createPolkadotXcmHeader: vi.fn().mockReturnValue('polkadotXcmHeader'),
  isTMultiLocation: vi.fn()
}))

vi.mock('../pallets/assets', () => ({
  getNativeAssetSymbol: vi.fn().mockReturnValue('DOT'),
  getParaId: vi.fn().mockReturnValue(1000)
}))

class TestParachainNode extends ParachainNode<ApiPromise, Extrinsic> {
  transferXTokens(
    _input: XTokensTransferInput<ApiPromise, Extrinsic>,
    _currencySelection: TXTokensCurrencySelection,
    _fees: string | number = 'Unlimited'
  ) {
    return 'transferXTokens called'
  }

  transferXTransfer(_input: XTransferTransferInput<ApiPromise, Extrinsic>) {
    return 'transferXTransfer called'
  }

  transferPolkadotXCM(
    _options: PolkadotXCMTransferInput<ApiPromise, Extrinsic>,
    _section: PolkadotXcmSection,
    _fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ) {
    return 'transferPolkadotXCM called'
  }

  public exposeCanUseXTokens(options: TSendInternalOptions<ApiPromise, Extrinsic>): boolean {
    return this.canUseXTokens(options)
  }
}

class NoXTokensNode extends ParachainNode<ApiPromise, Extrinsic> {
  transferXTransfer(_input: XTransferTransferInput<ApiPromise, Extrinsic>) {
    return 'transferXTransfer called'
  }
}

class OnlyPolkadotXCMNode extends ParachainNode<ApiPromise, Extrinsic> {
  transferPolkadotXCM(
    _options: PolkadotXCMTransferInput<ApiPromise, Extrinsic>,
    _section: PolkadotXcmSection,
    _fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ) {
    return 'transferPolkadotXCM called'
  }
}

class NoSupportNode extends ParachainNode<ApiPromise, Extrinsic> {}

describe('ParachainNode', () => {
  let node: TestParachainNode

  beforeEach(() => {
    node = new TestParachainNode('Acala', 'TestNode', 'polkadot', Version.V3)
  })

  it('should create an instance', () => {
    expect(node).toBeDefined()
  })

  it('should get the name', () => {
    expect(node.name).toBe('TestNode')
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
      api: {},
      currencySymbol: 'DOT',
      amount: '100',
      address: 'destinationAddress'
    } as TSendInternalOptions<ApiPromise, Extrinsic>
    expect(node.exposeCanUseXTokens(options)).toBe(true)
  })

  it('should call transferXTokens when supportsXTokens and canUseXTokens return true', () => {
    const options = {
      api: {},
      currencySymbol: 'DOT',
      amount: '100',
      address: 'destinationAddress'
    } as TSendInternalOptions<ApiPromise, Extrinsic>

    const transferXTokensSpy = vi.spyOn(node, 'transferXTokens')

    const result = node.transfer(options)

    expect(transferXTokensSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTokens called')
  })

  it('should call transferXTransfer when supportsXTransfer returns true', () => {
    const node = new NoXTokensNode('Acala', 'TestNode', 'polkadot', Version.V3)
    const options = {
      api: {},
      currencySymbol: 'DOT',
      amount: '100',
      address: 'destinationAddress'
    } as TSendInternalOptions<ApiPromise, Extrinsic>

    const transferXTransferSpy = vi.spyOn(node, 'transferXTransfer')

    const result = node.transfer(options)

    expect(transferXTransferSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTransfer called')
  })

  it('should call transferPolkadotXCM when supportsPolkadotXCM returns true', () => {
    const node = new OnlyPolkadotXCMNode('Acala', 'TestNode', 'polkadot', Version.V3)
    const options = {
      api: {},
      currencySymbol: 'DOT',
      amount: '100',
      address: 'destinationAddress'
    } as TSendInternalOptions<ApiPromise, Extrinsic>

    const transferPolkadotXCMSpy = vi.spyOn(node, 'transferPolkadotXCM')

    const result = node.transfer(options)

    expect(transferPolkadotXCMSpy).toHaveBeenCalled()
    expect(result).toBe('transferPolkadotXCM called')
  })

  it('should throw NoXCMSupportImplementedError when no transfer methods are supported', () => {
    const node = new NoSupportNode('Acala', 'TestNode', 'polkadot', Version.V3)
    const options = {
      api: {},
      currencySymbol: 'DOT',
      amount: '100',
      address: 'destinationAddress'
    } as TSendInternalOptions<ApiPromise, Extrinsic>

    expect(() => node.transfer(options)).toThrowError(NoXCMSupportImplementedError)
  })

  it('should not call transferXTokens when canUseXTokens returns false', () => {
    class TestNode extends TestParachainNode {
      protected canUseXTokens(_: TSendInternalOptions<ApiPromise, Extrinsic>): boolean {
        return false
      }
    }

    const node = new TestNode('Acala', 'TestNode', 'polkadot', Version.V3)
    node.transferXTransfer = vi.fn().mockReturnValue('transferXTransfer called')

    const options = {
      api: {},
      currencySymbol: 'DOT',
      amount: '100',
      address: 'destinationAddress'
    } as TSendInternalOptions<ApiPromise, Extrinsic>

    const transferXTokensSpy = vi.spyOn(node, 'transferXTokens')
    const transferXTransferSpy = vi.spyOn(node, 'transferXTransfer')

    const result = node.transfer(options)

    expect(transferXTokensSpy).not.toHaveBeenCalled()
    expect(transferXTransferSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTransfer called')
  })

  it('should throw error when destination is Polimec and node is not AssetHubPolkadot', () => {
    const options = {
      api: {},
      currencySymbol: 'DOT',
      amount: '100',
      address: 'destinationAddress',
      destination: 'Polimec'
    } as TSendInternalOptions<ApiPromise, Extrinsic>

    expect(() => node.transfer(options)).toThrowError(
      'Sending assets to Polimec is supported only from AssetHubPolkadot'
    )
  })

  it('should not throw error when destination is Polimec and node is AssetHubPolkadot', () => {
    const node = new TestParachainNode('AssetHubPolkadot', 'TestNode', 'polkadot', Version.V3)
    node.transferXTokens = vi.fn().mockReturnValue('transferXTokens called')

    const options = {
      api: {},
      currencySymbol: 'DOT',
      amount: '100',
      address: 'destinationAddress',
      destination: 'Polimec'
    } as TSendInternalOptions<ApiPromise, Extrinsic>

    const transferXTokensSpy = vi.spyOn(node, 'transferXTokens')

    const result = node.transfer(options)

    expect(transferXTokensSpy).toHaveBeenCalled()
    expect(result).toBe('transferXTokens called')
  })

  it('should throw InvalidCurrencyError when overridedCurrencyMultiLocation is invalid', () => {
    const node = new OnlyPolkadotXCMNode('Acala', 'TestNode', 'polkadot', Version.V3)
    const options = {
      api: {},
      currencySymbol: 'DOT',
      amount: '100',
      address: 'destinationAddress',
      overridedCurrencyMultiLocation: {}
    } as TSendInternalOptions<ApiPromise, Extrinsic>

    vi.spyOn(xcmUtils, 'isTMultiLocation').mockReturnValue(true)
    vi.spyOn(utils, 'verifyMultiLocation').mockReturnValue(false)

    expect(() => node.transfer(options)).toThrowError(InvalidCurrencyError)
  })

  it('should return correct serialized API call from transferRelayToPara', () => {
    const options = {} as TRelayToParaOptions<ApiPromise, Extrinsic>

    const result = node.transferRelayToPara(options)

    expect(result).toEqual({
      module: 'XcmPallet',
      section: 'reserve_transfer_assets',
      parameters: 'parameters'
    })
  })

  it('should return the first provider from getProvider', () => {
    expect(node.getProvider()).toBe('provider1')
  })

  it('should create API instance', async () => {
    const mockApi = {
      createApiInstance: vi.fn().mockResolvedValue('apiInstance')
    } as unknown as IPolkadotApi<ApiPromise, Extrinsic>
    const apiInstance = await node.createApiInstance(mockApi)

    expect(apiInstance).toBe('apiInstance')
  })

  it('should create currency spec', () => {
    const result = node.createCurrencySpec('100', 'ParaToRelay', Version.V3, 'currencyId')

    expect(result).toBe('currencySpec')
  })

  it('should create Polkadot XCM header', () => {
    const result = node.createPolkadotXcmHeader('ParaToRelay', Version.V3)

    expect(result).toBe('polkadotXcmHeader')
  })

  it('should get native asset symbol', () => {
    expect(node.getNativeAssetSymbol()).toBe('DOT')
  })
})
