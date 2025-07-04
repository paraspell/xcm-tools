import type { TMultiAsset } from '@paraspell/assets'
import { Parents, type TMultiLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DEFAULT_FEE_ASSET } from '../../constants'
import type { TRelayToParaOptions, TXcmVersioned } from '../../types'
import { addXcmVersionHeader, createBeneficiaryLocation, resolveParaId } from '../../utils'
import { createVersionedMultiAssets } from '../../utils/multiAsset'
import { constructRelayToParaParameters } from './constructRelayToParaParameters'
import { createVersionedDestination } from './utils'

vi.mock('../../utils', () => ({
  resolveParaId: vi.fn(),
  createBeneficiaryLocation: vi.fn(),
  addXcmVersionHeader: vi.fn()
}))

vi.mock('./utils', () => ({
  createVersionedDestination: vi.fn()
}))

vi.mock('../../utils/multiAsset', () => ({
  createVersionedMultiAssets: vi.fn()
}))

describe('constructRelayToParaParameters', () => {
  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const mockAmount = 1000
  const mockAddress = 'address123'
  const mockParaId = 100

  const options = {
    api: mockApi,
    origin: 'Polkadot',
    destination: 'Acala',
    address: mockAddress,
    paraIdTo: mockParaId,
    asset: { amount: mockAmount }
  } as TRelayToParaOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(createBeneficiaryLocation).mockReturnValue(
      'mockedBeneficiary' as unknown as TMultiLocation
    )
    vi.mocked(addXcmVersionHeader).mockReturnValue(
      'mockedVersionedBeneficiary' as unknown as TXcmVersioned<TMultiLocation>
    )
    vi.mocked(resolveParaId).mockReturnValue(mockParaId)
    vi.mocked(createVersionedMultiAssets).mockReturnValue({} as TXcmVersioned<TMultiAsset[]>)
    vi.mocked(createVersionedDestination).mockReturnValue(
      'mockedDest' as unknown as TXcmVersioned<TMultiLocation>
    )
  })

  it('should construct parameters with multi-location destination and include fee', () => {
    const result = constructRelayToParaParameters(options, Version.V4, { includeFee: true })

    expect(createVersionedDestination).toHaveBeenCalledWith(
      Version.V4,
      options.origin,
      options.destination,
      mockParaId
    )
    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: mockApi,
      address: mockAddress,
      version: Version.V4
    })
    expect(createVersionedMultiAssets).toHaveBeenCalledWith(Version.V4, mockAmount, {
      parents: Parents.ZERO,
      interior: 'Here'
    })
    expect(result).toEqual({
      dest: 'mockedDest',
      beneficiary: 'mockedVersionedBeneficiary',
      assets: {},
      fee_asset_item: DEFAULT_FEE_ASSET,
      weight_limit: 'Unlimited'
    })
  })

  it('should construct parameters without fee for multi-location destination', () => {
    const result = constructRelayToParaParameters(options, Version.V4)

    expect(createVersionedDestination).toHaveBeenCalledWith(
      Version.V4,
      options.origin,
      options.destination,
      mockParaId
    )
    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: mockApi,
      address: mockAddress,
      version: Version.V4
    })
    expect(createVersionedMultiAssets).toHaveBeenCalledWith(Version.V4, mockAmount, {
      parents: Parents.ZERO,
      interior: 'Here'
    })
    expect(result).toEqual({
      dest: 'mockedDest',
      beneficiary: 'mockedVersionedBeneficiary',
      assets: {},
      fee_asset_item: DEFAULT_FEE_ASSET
    })
  })

  it('should construct parameters without specifying paraIdTo and include fee', () => {
    const paraIdTo = undefined

    const result = constructRelayToParaParameters(
      {
        ...options,
        paraIdTo
      },
      Version.V4,
      { includeFee: true }
    )

    expect(resolveParaId).toHaveBeenCalledWith(paraIdTo, options.destination)
    expect(createVersionedDestination).toHaveBeenCalledWith(
      Version.V4,
      options.origin,
      options.destination,
      mockParaId
    )
    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: mockApi,
      address: mockAddress,
      version: Version.V4
    })
    expect(createVersionedMultiAssets).toHaveBeenCalledWith(Version.V4, mockAmount, {
      parents: Parents.ZERO,
      interior: 'Here'
    })
    expect(result).toEqual({
      dest: 'mockedDest',
      beneficiary: 'mockedVersionedBeneficiary',
      assets: {},
      fee_asset_item: DEFAULT_FEE_ASSET,
      weight_limit: 'Unlimited'
    })
  })
})
