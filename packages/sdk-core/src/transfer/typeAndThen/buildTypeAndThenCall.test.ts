import type { TAsset } from '@paraspell/assets'
import { type TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getParaId } from '../../chains/config'
import { RELAY_LOCATION } from '../../constants'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TChainWithApi, TTypeAndThenCallContext } from '../../types'
import { addXcmVersionHeader, createAsset } from '../../utils'
import { buildTypeAndThenCall } from './buildTypeAndThenCall'

vi.mock('../../chains/config', () => ({
  getParaId: vi.fn()
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  createDestination: vi.fn()
}))

vi.mock('../../utils', () => ({
  addXcmVersionHeader: vi.fn(value => ({ versioned: value })),
  createAsset: vi.fn()
}))

describe('buildTypeAndThenCall', () => {
  const mockVersion = Version.V5

  const assetInfo = {
    location: { parents: 1, interior: 'Here' }
  }

  const mockContext = {
    origin: { chain: 'Polkadot' } as TChainWithApi<unknown, unknown>,
    reserve: { chain: 'Polkadot' } as TChainWithApi<unknown, unknown>,
    dest: { chain: 'Kusama' } as TChainWithApi<unknown, unknown>,
    assetInfo,
    options: {
      version: mockVersion
    }
  } as TTypeAndThenCallContext<unknown, unknown>

  const mockAssets = [{ id: 'asset1' }] as unknown as TAsset[]
  const mockCustomXcm = ['xcm1', 'xcm2']
  const mockDestination = {} as TLocation
  const mockParaId = 1000

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getParaId).mockReturnValue(mockParaId)
    vi.mocked(createDestination).mockReturnValue(mockDestination)
    vi.mocked(createAsset).mockImplementation((_version, amount, location) => ({
      id: location,
      fun: { Fungible: amount }
    }))
  })

  it('should build correct call when chain equals reserveChain and asset location is not RELAY_LOCATION', () => {
    const result = buildTypeAndThenCall(mockContext, false, mockCustomXcm, mockAssets)

    expect(getParaId).toHaveBeenCalledWith(mockContext.dest.chain)
    expect(createDestination).toHaveBeenCalledWith(
      mockVersion,
      mockContext.origin.chain,
      mockContext.dest.chain,
      mockParaId
    )

    expect(result).toEqual({
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: { versioned: mockDestination },
        assets: { versioned: mockAssets },
        assets_transfer_type: 'LocalReserve',
        remote_fees_id: { versioned: RELAY_LOCATION },
        fees_transfer_type: 'LocalReserve',
        custom_xcm_on_dest: { versioned: mockCustomXcm },
        weight_limit: 'Unlimited'
      }
    })
  })

  it('should build correct call when chain does not equal reserveChain and asset location equals RELAY_LOCATION', () => {
    const differentReserve = { chain: 'Kusama' } as TChainWithApi<unknown, unknown>

    const result = buildTypeAndThenCall(
      {
        ...mockContext,
        reserve: differentReserve
      },
      true,
      mockCustomXcm,
      mockAssets
    )

    expect(getParaId).toHaveBeenCalledWith(differentReserve.chain)
    expect(createDestination).toHaveBeenCalledWith(
      mockVersion,
      mockContext.origin.chain,
      differentReserve.chain,
      mockParaId
    )

    expect(result).toEqual({
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: { versioned: mockDestination },
        assets: { versioned: mockAssets },
        assets_transfer_type: 'DestinationReserve',
        remote_fees_id: { versioned: assetInfo.location },
        fees_transfer_type: 'DestinationReserve',
        custom_xcm_on_dest: { versioned: mockCustomXcm },
        weight_limit: 'Unlimited'
      }
    })
  })

  it('should use LocalReserve when chain equals reserveChain', () => {
    const mockOrigin = { chain: 'AssetHubPolkadot' } as TChainWithApi<unknown, unknown>
    const mockReserve = { chain: 'AssetHubPolkadot' } as TChainWithApi<unknown, unknown>

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

    expect(result.parameters.assets_transfer_type).toBe('LocalReserve')
    expect(result.parameters.fees_transfer_type).toBe('LocalReserve')
  })

  it('should use DestinationReserve when origin chain does not equal reserveChain', () => {
    const mockOrigin = { chain: 'Polkadot' } as TChainWithApi<unknown, unknown>
    const mockReserve = { chain: 'Kusama' } as TChainWithApi<unknown, unknown>

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

    expect(result.parameters.assets_transfer_type).toBe('DestinationReserve')
    expect(result.parameters.fees_transfer_type).toBe('DestinationReserve')
  })

  it('should use asset location as feeAssetLocation when asset location equals RELAY_LOCATION', () => {
    const result = buildTypeAndThenCall(mockContext, true, mockCustomXcm, mockAssets)

    expect(addXcmVersionHeader).toHaveBeenCalledWith(assetInfo.location, mockVersion)
    expect(result.parameters.remote_fees_id).toEqual({
      versioned: assetInfo.location
    })
  })

  it('should use RELAY_LOCATION as feeAssetLocation when asset location does not equal RELAY_LOCATION', () => {
    const result = buildTypeAndThenCall(mockContext, false, mockCustomXcm, mockAssets)
    expect(addXcmVersionHeader).toHaveBeenCalledWith(RELAY_LOCATION, mockVersion)
    expect(result.parameters.remote_fees_id).toEqual({ versioned: RELAY_LOCATION })
  })

  it('should call addXcmVersionHeader for all versioned parameters', () => {
    buildTypeAndThenCall(mockContext, false, mockCustomXcm, mockAssets)

    expect(addXcmVersionHeader).toHaveBeenCalledWith(mockDestination, mockVersion)
    expect(addXcmVersionHeader).toHaveBeenCalledWith(mockAssets, mockVersion)
    expect(addXcmVersionHeader).toHaveBeenCalledWith(RELAY_LOCATION, mockVersion)
    expect(addXcmVersionHeader).toHaveBeenCalledWith(mockCustomXcm, mockVersion)
    expect(addXcmVersionHeader).toHaveBeenCalledTimes(4)
  })

  it('should always set weight_limit to Unlimited', () => {
    const result = buildTypeAndThenCall(mockContext, false, mockCustomXcm, mockAssets)
    expect(result.parameters.weight_limit).toBe('Unlimited')
  })
})
