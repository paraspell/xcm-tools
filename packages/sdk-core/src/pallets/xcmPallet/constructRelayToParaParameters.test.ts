import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, Parents } from '../../types'
import { generateAddressPayload } from '../../utils/generateAddressPayload'
import { DEFAULT_FEE_ASSET } from '../../const'
import type {
  TCurrencySelectionHeaderArr,
  TMultiLocation,
  TMultiLocationHeader,
  TRelayToParaOptions
} from '../../types'
import { createCurrencySpec, createPolkadotXcmHeader } from './utils'
import type { IPolkadotApi } from '../../api'
import { constructRelayToParaParameters } from './constructRelayToParaParameters'
import { getParaId } from '../../nodes/config'

vi.mock('../../nodes/config', () => ({
  getParaId: vi.fn()
}))

vi.mock('../../utils/generateAddressPayload', () => ({
  generateAddressPayload: vi.fn()
}))

vi.mock('./utils', () => ({
  createCurrencySpec: vi.fn(),
  createPolkadotXcmHeader: vi.fn(),
  isTMultiLocation: vi.fn()
}))

describe('constructRelayToParaParameters', () => {
  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const mockAmount = 1000
  const mockAddress = 'address123'
  const mockParaId = 100

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(generateAddressPayload).mockReturnValue('mockedBeneficiary' as TMultiLocationHeader)
    vi.mocked(createPolkadotXcmHeader).mockReturnValue('mockedDest' as TMultiLocationHeader)
    vi.mocked(createCurrencySpec).mockReturnValue('mockedAssets' as TCurrencySelectionHeaderArr)
    vi.mocked(getParaId).mockReturnValue(mockParaId)
  })

  it('should construct parameters with multi-location destination and include fee', () => {
    const options = {
      api: mockApi,
      destination: 'Acala',
      address: mockAddress,
      paraIdTo: mockParaId,
      asset: { amount: mockAmount }
    } as TRelayToParaOptions<unknown, unknown>

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
      assets: 'mockedAssets',
      fee_asset_item: DEFAULT_FEE_ASSET,
      weight_limit: 'Unlimited'
    })
  })

  it('should construct parameters without fee for multi-location destination', () => {
    const options = {
      api: mockApi,
      destination: 'Acala',
      address: mockAddress,
      asset: { amount: mockAmount }
    } as TRelayToParaOptions<unknown, unknown>

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
      assets: 'mockedAssets',
      fee_asset_item: DEFAULT_FEE_ASSET
    })
  })

  it('should construct parameters without specifying paraIdTo and include fee', () => {
    const options = {
      api: mockApi,
      destination: 'Acala',
      address: mockAddress,
      asset: { amount: mockAmount }
    } as TRelayToParaOptions<unknown, unknown>

    const result = constructRelayToParaParameters(options, Version.V2, { includeFee: true })

    expect(getParaId).toHaveBeenCalledWith(options.destination)
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
      assets: 'mockedAssets',
      fee_asset_item: DEFAULT_FEE_ASSET,
      weight_limit: 'Unlimited'
    })
  })

  it('should construct parameters with undefined paraId when destination is an object', () => {
    const options = {
      api: mockApi,
      destination: {
        parents: Parents.ZERO,
        interior: [
          {
            X1: { Parachain: 1000 }
          }
        ]
      } as TMultiLocation,
      address: mockAddress,
      asset: { amount: mockAmount }
    } as TRelayToParaOptions<unknown, unknown>

    const result = constructRelayToParaParameters(options, Version.V1)

    expect(createPolkadotXcmHeader).toHaveBeenCalledWith(
      'RelayToPara',
      Version.V1,
      options.destination,
      undefined
    )
    expect(generateAddressPayload).toHaveBeenCalledWith(
      mockApi,
      'RelayToPara',
      null,
      mockAddress,
      Version.V1,
      undefined
    )
    expect(createCurrencySpec).toHaveBeenCalledWith(mockAmount, Version.V1, Parents.ZERO)
    expect(result).toEqual({
      dest: 'mockedDest',
      beneficiary: 'mockedBeneficiary',
      assets: 'mockedAssets',
      fee_asset_item: DEFAULT_FEE_ASSET
    })
  })
})
