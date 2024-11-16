import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, Parents } from '../../types'
import { generateAddressPayload } from '../../utils/generateAddressPayload'
import { DEFAULT_FEE_ASSET } from '../../const'
import type {
  TCurrencySelectionHeaderArr,
  TMultiLocationHeader,
  TRelayToParaOptions
} from '../../types'
import { createCurrencySpec, createPolkadotXcmHeader } from './utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs'
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
  createPolkadotXcmHeader: vi.fn()
}))

describe('constructRelayToParaParameters', () => {
  const mockApi = {} as IPolkadotApi<ApiPromise, Extrinsic>
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
      amount: mockAmount,
      paraIdTo: mockParaId
    } as unknown as TRelayToParaOptions<ApiPromise, Extrinsic>

    const result = constructRelayToParaParameters(options, Version.V1, true)

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
      destination: 'SomeParachain',
      address: mockAddress,
      amount: mockAmount
    } as unknown as TRelayToParaOptions<ApiPromise, Extrinsic>

    const result = constructRelayToParaParameters(options, Version.V3)

    expect(createPolkadotXcmHeader).toHaveBeenCalledWith(
      'RelayToPara',
      Version.V3,
      'SomeParachain',
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
      destination: 'AnotherParachain',
      address: mockAddress,
      amount: mockAmount
    } as unknown as TRelayToParaOptions<ApiPromise, Extrinsic>

    const result = constructRelayToParaParameters(options, Version.V2, true)

    expect(getParaId).toHaveBeenCalledWith('AnotherParachain')
    expect(createPolkadotXcmHeader).toHaveBeenCalledWith(
      'RelayToPara',
      Version.V2,
      'AnotherParachain',
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
      destination: { type: 'MultiLocation', value: 'ComplexDestination' },
      address: mockAddress,
      amount: mockAmount
    } as unknown as TRelayToParaOptions<ApiPromise, Extrinsic>

    const result = constructRelayToParaParameters(options, Version.V1)

    expect(createPolkadotXcmHeader).toHaveBeenCalledWith(
      'RelayToPara',
      Version.V1,
      { type: 'MultiLocation', value: 'ComplexDestination' },
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
