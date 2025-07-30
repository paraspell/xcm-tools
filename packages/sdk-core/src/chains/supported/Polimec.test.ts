import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  TPolkadotXCMTransferOptions,
  TRelayToParaOptions,
  TTransferLocalOptions
} from '../../types'
import { getChain } from '../../utils'
import type Polimec from './Polimec'

vi.mock('../../pallets/assets', () => ({
  getParaId: vi.fn().mockReturnValue(1000)
}))

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('Polimec', () => {
  let polimec: Polimec<unknown, unknown>

  const mockApi = {
    callTxMethod: vi.fn().mockReturnValue('mocked result'),
    accountToHex: vi.fn().mockReturnValue('0x0000000000000000')
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockExtrinsic = {} as unknown

  beforeEach(() => {
    vi.clearAllMocks()
    polimec = getChain<unknown, unknown, 'Polimec'>('Polimec')
    vi.mocked(transferPolkadotXcm).mockResolvedValue(mockExtrinsic)
  })

  it('should initialize with correct values', () => {
    expect(polimec.chain).toBe('Polimec')
    expect(polimec.info).toBe('polimec')
    expect(polimec.type).toBe('polkadot')
    expect(polimec.version).toBe(Version.V5)
  })

  it('should throw ScenarioNotSupportedError when scenario is not ParaToRelay or ParaToPara with AssetHubPolkadot or Hydration', async () => {
    const input = {
      api: mockApi,
      version: polimec.version,
      destination: 'Acala',
      address: 'SomeAddress',
      scenario: 'ParaToPara',
      paraIdTo: 2000,
      assetInfo: { symbol: 'DOT', amount: 1000n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await expect(polimec.transferPolkadotXCM(input)).rejects.toThrow(ScenarioNotSupportedError)
  })

  it('should transfer Polkadot XCM when scenario is ParaToRelay', async () => {
    const input = {
      api: mockApi,
      version: polimec.version,
      destination: 'Acala',
      address: 'SomeAddress',
      scenario: 'ParaToRelay',
      paraIdTo: 2000,
      assetInfo: { symbol: 'DOT', amount: 1000n }
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
      assetInfo: { symbol: 'DOT', amount: 1000n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const spy = vi.spyOn(mockApi, 'callTxMethod')

    const result = await polimec.transferPolkadotXCM(input)

    expect(spy).toHaveBeenCalled()
    expect(result).toBe('mocked result')
  })

  it('should transfer Polkadot XCM when scenario is ParaToPara and destination is AssetHubPolkadot', async () => {
    const input = {
      api: mockApi,
      version: polimec.version,
      destination: 'AssetHubPolkadot',
      address: 'SomeAddress',
      scenario: 'ParaToPara',
      paraIdTo: 2000,
      assetInfo: { symbol: 'DOT', amount: 1000n, location: DOT_LOCATION }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const result = await polimec.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      expect.objectContaining({
        asset: expect.objectContaining({
          id: DOT_LOCATION
        })
      }),
      'transfer_assets',
      'Unlimited'
    )
    expect(result).toBe(mockExtrinsic)
  })

  it('should use asset.location when asset is foreign and has location', async () => {
    const location = { parents: 0, interior: 'Here' }

    const input = {
      api: mockApi,
      version: polimec.version,
      destination: 'AssetHubPolkadot',
      address: 'SomeAddress',
      scenario: 'ParaToPara',
      paraIdTo: 2000,
      assetInfo: { symbol: 'XYZ', location: location, amount: 1000n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const result = await polimec.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      expect.objectContaining({
        asset: expect.objectContaining({
          id: location
        })
      }),
      'transfer_assets',
      'Unlimited'
    )
    expect(result).toBe(mockExtrinsic)
  })

  it('should throw InvalidCurrencyError when asset is not supported in getAssetLocation', async () => {
    const input = {
      api: mockApi,
      version: polimec.version,
      destination: 'AssetHubPolkadot',
      address: 'SomeAddress',
      scenario: 'ParaToPara',
      paraIdTo: 2000,
      assetInfo: { symbol: 'XYZ', amount: 1000n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await expect(polimec.transferPolkadotXCM(input)).rejects.toThrow(InvalidCurrencyError)
  })

  it('should create a correct call object in transferRelayToPara', () => {
    const options = {
      version: polimec.version,
      api: mockApi,
      address: 'SomeAddress',
      destination: 'Acala',
      paraIdTo: 2000,
      assetInfo: { symbol: 'DOT', amount: 1000n }
    } as TRelayToParaOptions<unknown, unknown>

    const call = polimec.transferRelayToPara(options)

    expect(call).toHaveProperty('module', 'XcmPallet')
    expect(call).toHaveProperty('method', 'transfer_assets_using_type_and_then')
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
      assetInfo: { symbol: 'DOT', amount: 1000n }
    } as TRelayToParaOptions<unknown, unknown>

    const call = polimec.transferRelayToPara(options)

    expect(call).toHaveProperty('module', 'XcmPallet')
    expect(call).toHaveProperty('method', 'transfer_assets_using_type_and_then')
    expect(call.parameters).toHaveProperty('dest')
    expect(call.parameters).toHaveProperty('assets')
    expect(call.parameters).toHaveProperty('assets_transfer_type', 'Teleport')
    expect(call.parameters).toHaveProperty('remote_fees_id')
    expect(call.parameters).toHaveProperty('fees_transfer_type', 'Teleport')
    expect(call.parameters).toHaveProperty('custom_xcm_on_dest')
    expect(call.parameters).toHaveProperty('weight_limit', 'Unlimited')
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw an error when asset is not a foreign asset', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => polimec.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error when assetId is undefined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => polimec.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1', location: {} },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      polimec.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'ForeignAssets',
        method: 'transfer',
        parameters: {
          id: {},
          target: { Id: mockOptions.address },
          amount: BigInt(mockOptions.assetInfo.amount)
        }
      })
    })
  })
})
