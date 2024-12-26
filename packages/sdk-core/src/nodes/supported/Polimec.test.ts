import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Polimec from './Polimec'
import type { TPolkadotXCMTransferOptions, TRelayToParaOptions } from '../../types'
import { Version } from '../../types'
import { ScenarioNotSupportedError, InvalidCurrencyError } from '../../errors'
import type { IPolkadotApi } from '../../api'
import { getNode } from '../../utils'
import { DOT_MULTILOCATION } from '../../const'
import PolkadotXCMTransferImpl from '../polkadotXcm'

vi.mock('../../pallets/assets', () => ({
  getParaId: vi.fn().mockReturnValue(1000)
}))

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn().mockResolvedValue('mocked polkadotXcm result')
  }
}))

describe('Polimec', () => {
  let polimec: Polimec<unknown, unknown>

  const mockApi = {
    callTxMethod: vi.fn().mockReturnValue('mocked result'),
    createAccountId: vi.fn().mockReturnValue('0x0000000000000000')
  } as unknown as IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    polimec = getNode<unknown, unknown, 'Polimec'>('Polimec')
  })

  it('should initialize with correct values', () => {
    expect(polimec.node).toBe('Polimec')
    expect(polimec.info).toBe('polimec')
    expect(polimec.type).toBe('polkadot')
    expect(polimec.version).toBe(Version.V3)
  })

  it('should throw ScenarioNotSupportedError when scenario is not ParaToRelay or ParaToPara with AssetHubPolkadot', async () => {
    const input = {
      api: mockApi,
      version: Version.V3,
      destination: 'Acala',
      address: 'SomeAddress',
      scenario: 'ParaToPara',
      paraIdTo: 2000,
      asset: { symbol: 'DOT', amount: '1000' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await expect(polimec.transferPolkadotXCM(input)).rejects.toThrow(ScenarioNotSupportedError)
  })

  it('should transfer Polkadot XCM when scenario is ParaToRelay', async () => {
    const input = {
      api: mockApi,
      version: Version.V3,
      destination: 'Acala',
      address: 'SomeAddress',
      scenario: 'ParaToRelay',
      paraIdTo: 2000,
      asset: { symbol: 'DOT', amount: '1000' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const spy = vi.spyOn(mockApi, 'callTxMethod')

    const result = await polimec.transferPolkadotXCM(input)

    expect(spy).toHaveBeenCalled()
    expect(result).toBe('mocked result')
  })

  it('should use default version when version is undefined in transferPolkadotXCM', async () => {
    const input = {
      api: mockApi,
      destination: 'Acala',
      address: 'SomeAddress',
      scenario: 'ParaToRelay',
      paraIdTo: 2000,
      asset: { symbol: 'DOT', amount: '1000' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const spy = vi.spyOn(mockApi, 'callTxMethod')

    const result = await polimec.transferPolkadotXCM(input)

    expect(spy).toHaveBeenCalled()
    expect(result).toBe('mocked result')
  })

  it('should transfer Polkadot XCM when scenario is ParaToPara and destination is AssetHubPolkadot', async () => {
    const input = {
      api: mockApi,
      version: Version.V3,
      destination: 'AssetHubPolkadot',
      address: 'SomeAddress',
      scenario: 'ParaToPara',
      paraIdTo: 2000,
      asset: { symbol: 'DOT', amount: '1000' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    const result = await polimec.transferPolkadotXCM(input)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        currencySelection: {
          [Version.V3]: [
            expect.objectContaining({
              id: {
                Concrete: DOT_MULTILOCATION
              }
            })
          ]
        }
      }),
      'transfer_assets',
      'Unlimited'
    )
    expect(result).toBe('mocked polkadotXcm result')
  })

  it('should use DOT_MULTILOCATION when asset is not foreign and symbol is DOT', async () => {
    const input = {
      api: mockApi,
      version: Version.V3,
      destination: 'AssetHubPolkadot',
      address: 'SomeAddress',
      scenario: 'ParaToPara',
      paraIdTo: 2000,
      asset: { symbol: 'DOT', amount: '1000' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    const result = await polimec.transferPolkadotXCM(input)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        currencySelection: {
          [Version.V3]: [
            expect.objectContaining({
              id: {
                Concrete: DOT_MULTILOCATION
              }
            })
          ]
        }
      }),
      'transfer_assets',
      'Unlimited'
    )
    expect(result).toBe('mocked polkadotXcm result')
  })

  it('should use asset.multiLocation when asset is foreign and has multiLocation', async () => {
    const assetMultiLocation = { parents: 0, interior: 'Here' }

    const input = {
      api: mockApi,
      version: Version.V3,
      destination: 'AssetHubPolkadot',
      address: 'SomeAddress',
      scenario: 'ParaToPara',
      paraIdTo: 2000,
      asset: { symbol: 'XYZ', multiLocation: assetMultiLocation, amount: '1000' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    const result = await polimec.transferPolkadotXCM(input)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        currencySelection: {
          [Version.V3]: [
            expect.objectContaining({
              id: {
                Concrete: assetMultiLocation
              }
            })
          ]
        }
      }),
      'transfer_assets',
      'Unlimited'
    )
    expect(result).toBe('mocked polkadotXcm result')
  })

  it('should throw InvalidCurrencyError when asset is not supported in getAssetMultiLocation', async () => {
    const input = {
      api: mockApi,
      version: Version.V3,
      destination: 'AssetHubPolkadot',
      address: 'SomeAddress',
      scenario: 'ParaToPara',
      paraIdTo: 2000,
      asset: { symbol: 'XYZ', amount: '1000' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await expect(polimec.transferPolkadotXCM(input)).rejects.toThrow(InvalidCurrencyError)
  })

  it('should create a correct call object in transferRelayToPara', () => {
    const options = {
      version: Version.V3,
      api: mockApi,
      address: 'SomeAddress',
      destination: 'Acala',
      paraIdTo: 2000,
      asset: { symbol: 'DOT', amount: '1000' }
    } as TRelayToParaOptions<unknown, unknown>

    const call = polimec.transferRelayToPara(options)

    expect(call).toHaveProperty('module', 'XcmPallet')
    expect(call).toHaveProperty('section', 'transfer_assets_using_type_and_then')
    expect(call.parameters).toHaveProperty('dest')
    expect(call.parameters).toHaveProperty('assets')
    expect(call.parameters).toHaveProperty('assets_transfer_type', 'Teleport')
    expect(call.parameters).toHaveProperty('remote_fees_id')
    expect(call.parameters).toHaveProperty('fees_transfer_type', 'Teleport')
    expect(call.parameters).toHaveProperty('custom_xcm_on_dest')
    expect(call.parameters).toHaveProperty('weight_limit', 'Unlimited')
  })

  it('should use default version in transferRelayToPara when version is undefined', () => {
    const options = {
      api: mockApi,
      address: 'SomeAddress',
      destination: 'Acala',
      paraIdTo: 2000,
      asset: { symbol: 'DOT', amount: '1000' }
    } as TRelayToParaOptions<unknown, unknown>

    const call = polimec.transferRelayToPara(options)

    expect(call).toHaveProperty('module', 'XcmPallet')
    expect(call).toHaveProperty('section', 'transfer_assets_using_type_and_then')
    expect(call.parameters).toHaveProperty('dest')
    expect(call.parameters).toHaveProperty('assets')
    expect(call.parameters).toHaveProperty('assets_transfer_type', 'Teleport')
    expect(call.parameters).toHaveProperty('remote_fees_id')
    expect(call.parameters).toHaveProperty('fees_transfer_type', 'Teleport')
    expect(call.parameters).toHaveProperty('custom_xcm_on_dest')
    expect(call.parameters).toHaveProperty('weight_limit', 'Unlimited')
  })
})
