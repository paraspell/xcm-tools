import type { TAsset, TAssetWithFee } from '@paraspell/assets'
import { isTrustedChain, type TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { RELAY_LOCATION } from '../../constants'
import type { TChainWithApi, TTypeAndThenCallContext } from '../../types'
import { createDestination, isNativeAssetTeleport } from '../../utils'
import { buildTypeAndThenCall } from './buildTypeAndThenCall'

vi.mock('../../utils/location')
vi.mock('../../utils/transfer/isNativeAssetTeleport')

vi.mock('@paraspell/sdk-common', async importActual => ({
  ...(await importActual()),
  isTrustedChain: vi.fn()
}))

describe('buildTypeAndThenCall', () => {
  const mockApi = {
    getParaId: vi.fn(),
    getXcmPallet: vi.fn(),
    localizeLocation: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const getParaIdSpy = vi.spyOn(mockApi, 'getParaId')
  const mockVersion = Version.V5
  const mockDestination: TLocation = {
    parents: 1,
    interior: { X1: { Parachain: 2000 } }
  }
  const mockContext = {
    origin: { chain: 'Polkadot', api: mockApi },
    reserve: { chain: 'Polkadot', api: mockApi },
    dest: { chain: 'Kusama', api: mockApi },
    assetInfo: {
      amount: 1000n,
      location: RELAY_LOCATION,
      symbol: 'DOT',
      decimals: 10
    },
    options: {
      version: mockVersion
    }
  } as TTypeAndThenCallContext<unknown, unknown, unknown>

  const mockAssets: TAsset[] = [
    {
      id: RELAY_LOCATION,
      fun: { Fungible: 1300n }
    }
  ]
  const mockCustomXcm = ['xcm1', 'xcm2']

  const mockParaId = 1000

  beforeEach(() => {
    vi.resetAllMocks()
    getParaIdSpy.mockReturnValue(mockParaId)
    vi.spyOn(mockApi, 'getXcmPallet').mockReturnValue('XcmPallet')
    vi.spyOn(mockApi, 'localizeLocation').mockImplementation((_chain, location) => location)
    vi.mocked(createDestination).mockReturnValue(mockDestination)
  })

  it('should build correct call when chain equals reserveChain and asset location is not RELAY_LOCATION', () => {
    const result = buildTypeAndThenCall(mockContext, false, mockCustomXcm, mockAssets)

    expect(getParaIdSpy).toHaveBeenCalledWith(mockContext.dest.chain)
    expect(createDestination).toHaveBeenCalledWith(
      mockContext.origin.api,
      mockVersion,
      mockContext.origin.chain,
      mockContext.dest.chain,
      mockParaId
    )

    expect(result).toEqual({
      module: 'XcmPallet',
      method: 'transfer_assets_using_type_and_then',
      params: {
        dest: { [mockVersion]: mockDestination },
        assets: { [mockVersion]: mockAssets },
        assets_transfer_type: 'LocalReserve',
        remote_fees_id: { [mockVersion]: RELAY_LOCATION },
        fees_transfer_type: 'LocalReserve',
        custom_xcm_on_dest: { [mockVersion]: mockCustomXcm },
        weight_limit: 'Unlimited'
      }
    })
  })

  it('should build correct call when chain does not equal reserveChain and asset location equals RELAY_LOCATION', () => {
    const differentReserve: TChainWithApi<unknown, unknown, unknown> = {
      chain: 'Kusama',
      api: mockApi
    }

    const result = buildTypeAndThenCall(
      {
        ...mockContext,
        reserve: differentReserve
      },
      true,
      mockCustomXcm,
      mockAssets
    )

    expect(getParaIdSpy).toHaveBeenCalledWith(differentReserve.chain)
    expect(createDestination).toHaveBeenCalledWith(
      mockContext.origin.api,
      mockVersion,
      mockContext.origin.chain,
      differentReserve.chain,
      mockParaId
    )

    expect(result).toEqual({
      module: 'XcmPallet',
      method: 'transfer_assets_using_type_and_then',
      params: {
        dest: { [mockVersion]: mockDestination },
        assets: { [mockVersion]: mockAssets },
        assets_transfer_type: 'DestinationReserve',
        remote_fees_id: { [mockVersion]: mockContext.assetInfo.location },
        fees_transfer_type: 'DestinationReserve',
        custom_xcm_on_dest: { [mockVersion]: mockCustomXcm },
        weight_limit: 'Unlimited'
      }
    })
  })

  it('should use LocalReserve when chain equals reserveChain', () => {
    const mockOrigin: TChainWithApi<unknown, unknown, unknown> = {
      chain: 'AssetHubPolkadot',
      api: mockApi
    }
    const mockReserve: TChainWithApi<unknown, unknown, unknown> = {
      chain: 'AssetHubPolkadot',
      api: mockApi
    }

    const result = buildTypeAndThenCall(
      {
        ...mockContext,
        origin: mockOrigin,
        reserve: mockReserve
      },
      false,
      mockCustomXcm,
      mockAssets
    )

    expect(result.params.assets_transfer_type).toBe('LocalReserve')
    expect(result.params.fees_transfer_type).toBe('LocalReserve')
  })

  it('should use DestinationReserve when origin chain does not equal reserveChain', () => {
    vi.mocked(isTrustedChain).mockReturnValue(false)
    const mockOrigin: TChainWithApi<unknown, unknown, unknown> = { chain: 'Polkadot', api: mockApi }
    const mockReserve: TChainWithApi<unknown, unknown, unknown> = { chain: 'Kusama', api: mockApi }

    const result = buildTypeAndThenCall(
      {
        ...mockContext,
        origin: mockOrigin,
        reserve: mockReserve
      },
      false,
      mockCustomXcm,
      mockAssets
    )

    expect(result.params.assets_transfer_type).toBe('DestinationReserve')
    expect(result.params.fees_transfer_type).toBe('DestinationReserve')
  })

  it('should use Teleport when forwarding a parachain native asset to/from AssetHub', () => {
    vi.mocked(isTrustedChain).mockReturnValue(false)
    vi.mocked(isNativeAssetTeleport).mockReturnValue(true)
    const mockOrigin: TChainWithApi<unknown, unknown, unknown> = {
      chain: 'AssetHubPolkadot',
      api: mockApi
    }
    const mockReserve: TChainWithApi<unknown, unknown, unknown> = {
      chain: 'Moonbeam',
      api: mockApi
    }
    const mockDest: TChainWithApi<unknown, unknown, unknown> = {
      chain: 'BifrostPolkadot',
      api: mockApi
    }

    const result = buildTypeAndThenCall(
      {
        ...mockContext,
        origin: mockOrigin,
        reserve: mockReserve,
        dest: mockDest
      },
      false,
      mockCustomXcm,
      mockAssets
    )

    expect(result.params.assets_transfer_type).toBe('Teleport')
    expect(result.params.fees_transfer_type).toBe('Teleport')
  })

  it('should use asset location as feeAssetLocation when asset location equals RELAY_LOCATION', () => {
    const result = buildTypeAndThenCall(mockContext, true, mockCustomXcm, mockAssets)

    expect(result.params.remote_fees_id).toEqual({
      [mockVersion]: mockContext.assetInfo.location
    })
  })

  it('should use RELAY_LOCATION as feeAssetLocation when asset location does not equal RELAY_LOCATION', () => {
    const result = buildTypeAndThenCall(mockContext, false, mockCustomXcm, mockAssets)
    expect(result.params.remote_fees_id).toEqual({ [mockVersion]: RELAY_LOCATION })
  })

  it('should always set weight_limit to Unlimited', () => {
    const result = buildTypeAndThenCall(mockContext, false, mockCustomXcm, mockAssets)
    expect(result.params.weight_limit).toBe('Unlimited')
  })

  it('should use fee asset from overriddenAsset array when provided', () => {
    const overriddenFeeAssetId: TLocation = {
      parents: 1,
      interior: { X1: { Parachain: 9999 } }
    }

    const overriddenAssets: TAssetWithFee[] = [
      {
        id: overriddenFeeAssetId,
        fun: { Fungible: 1n },
        isFeeAsset: true
      }
    ]

    const result = buildTypeAndThenCall(
      {
        ...mockContext,
        options: {
          ...mockContext.options,
          overriddenAsset: overriddenAssets
        }
      },
      false,
      mockCustomXcm,
      mockAssets
    )

    expect(result.params.remote_fees_id).toEqual({ [mockVersion]: overriddenFeeAssetId })
  })
})
