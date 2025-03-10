import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DEFAULT_FEE_ASSET } from '../../constants'
import type { TMultiAsset, TMultiLocation, TRelayToParaOptions, TXcmVersioned } from '../../types'
import { Parents, Version } from '../../types'
import { generateAddressPayload, resolveParaId } from '../../utils'
import { constructRelayToParaParameters } from './constructRelayToParaParameters'
import { createPolkadotXcmHeader, createVersionedMultiAssets } from './utils'

vi.mock('../../utils', () => ({
  generateAddressPayload: vi.fn(),
  resolveParaId: vi.fn()
}))

vi.mock('./utils', () => ({
  createVersionedMultiAssets: vi.fn(),
  createPolkadotXcmHeader: vi.fn()
}))

describe('constructRelayToParaParameters', () => {
  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const mockAmount = 1000
  const mockAddress = 'address123'
  const mockParaId = 100

  const options = {
    api: mockApi,
    destination: 'Acala',
    address: mockAddress,
    paraIdTo: mockParaId,
    asset: { amount: mockAmount }
  } as TRelayToParaOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(generateAddressPayload).mockReturnValue(
      'mockedBeneficiary' as unknown as TXcmVersioned<TMultiLocation>
    )
    vi.mocked(resolveParaId).mockReturnValue(mockParaId)
    vi.mocked(createVersionedMultiAssets).mockReturnValue({} as TXcmVersioned<TMultiAsset[]>)
    vi.mocked(createPolkadotXcmHeader).mockReturnValue(
      'mockedDest' as unknown as TXcmVersioned<TMultiLocation>
    )
  })

  it('should construct parameters with multi-location destination and include fee', () => {
    const result = constructRelayToParaParameters(options, Version.V1, { includeFee: true })

    expect(createPolkadotXcmHeader).toHaveBeenCalledWith(
      'RelayToPara',
      Version.V1,
      'Acala',
      mockParaId
    )
    expect(generateAddressPayload).toHaveBeenCalledWith(
      mockApi,
      'RelayToPara',
      null,
      mockAddress,
      Version.V1,
      mockParaId
    )
    expect(createVersionedMultiAssets).toHaveBeenCalledWith(Version.V1, mockAmount, {
      parents: Parents.ZERO,
      interior: 'Here'
    })
    expect(result).toEqual({
      dest: 'mockedDest',
      beneficiary: 'mockedBeneficiary',
      assets: {},
      fee_asset_item: DEFAULT_FEE_ASSET,
      weight_limit: 'Unlimited'
    })
  })

  it('should construct parameters without fee for multi-location destination', () => {
    const result = constructRelayToParaParameters(options, Version.V3)

    expect(createPolkadotXcmHeader).toHaveBeenCalledWith(
      'RelayToPara',
      Version.V3,
      options.destination,
      mockParaId
    )
    expect(generateAddressPayload).toHaveBeenCalledWith(
      mockApi,
      'RelayToPara',
      null,
      mockAddress,
      Version.V3,
      mockParaId
    )
    expect(createVersionedMultiAssets).toHaveBeenCalledWith(Version.V3, mockAmount, {
      parents: Parents.ZERO,
      interior: 'Here'
    })
    expect(result).toEqual({
      dest: 'mockedDest',
      beneficiary: 'mockedBeneficiary',
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
      Version.V2,
      { includeFee: true }
    )

    expect(resolveParaId).toHaveBeenCalledWith(paraIdTo, options.destination)
    expect(createPolkadotXcmHeader).toHaveBeenCalledWith(
      'RelayToPara',
      Version.V2,
      options.destination,
      mockParaId
    )
    expect(generateAddressPayload).toHaveBeenCalledWith(
      mockApi,
      'RelayToPara',
      null,
      mockAddress,
      Version.V2,
      mockParaId
    )
    expect(createVersionedMultiAssets).toHaveBeenCalledWith(Version.V2, mockAmount, {
      parents: Parents.ZERO,
      interior: 'Here'
    })
    expect(result).toEqual({
      dest: 'mockedDest',
      beneficiary: 'mockedBeneficiary',
      assets: {},
      fee_asset_item: DEFAULT_FEE_ASSET,
      weight_limit: 'Unlimited'
    })
  })
})
