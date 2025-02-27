import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, Parents } from '../../types'
import { DEFAULT_FEE_ASSET } from '../../constants'
import type { TMultiAsset, TMultiLocation, TRelayToParaOptions, TXcmVersioned } from '../../types'
import { createCurrencySpec, createPolkadotXcmHeader } from './utils'
import type { IPolkadotApi } from '../../api'
import { constructRelayToParaParameters } from './constructRelayToParaParameters'
import { generateAddressPayload, resolveParaId } from '../../utils'

vi.mock('../../utils', () => ({
  generateAddressPayload: vi.fn(),
  resolveParaId: vi.fn()
}))

vi.mock('./utils', () => ({
  createCurrencySpec: vi.fn(),
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
    vi.mocked(createCurrencySpec).mockReturnValue({} as TXcmVersioned<TMultiAsset[]>)
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
    expect(createCurrencySpec).toHaveBeenCalledWith(mockAmount, Version.V1, Parents.ZERO)
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
    expect(createCurrencySpec).toHaveBeenCalledWith(mockAmount, Version.V3, Parents.ZERO)
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
    expect(createCurrencySpec).toHaveBeenCalledWith(mockAmount, Version.V2, Parents.ZERO)
    expect(result).toEqual({
      dest: 'mockedDest',
      beneficiary: 'mockedBeneficiary',
      assets: {},
      fee_asset_item: DEFAULT_FEE_ASSET,
      weight_limit: 'Unlimited'
    })
  })
})
