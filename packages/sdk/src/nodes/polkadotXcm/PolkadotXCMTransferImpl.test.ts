import { describe, it, expect, vi } from 'vitest'
import PolkadotXCMTransferImpl from './PolkadotXCMTransferImpl'
import type {
  PolkadotXcmSection,
  PolkadotXCMTransferInput,
  TCurrencySelectionHeaderArr,
  TMultiLocationHeader
} from '../../types'
import { Version } from '../../types'
import type PolkadotJsApi from '../../api/PolkadotJsApi'

const mockApi = {
  call: vi.fn()
} as unknown as PolkadotJsApi

const mockHeader: TMultiLocationHeader = {
  [Version.V4]: {
    parents: 0,
    interior: {
      Here: null
    }
  }
}

const mockAddressSelection: TMultiLocationHeader = {
  [Version.V4]: {
    parents: 0,
    interior: {
      Here: null
    }
  }
}
const mockCurrencySelection: TCurrencySelectionHeaderArr = {
  [Version.V4]: [
    {
      id: {
        parents: 0,
        interior: {
          Here: null
        }
      },
      fun: {
        Fungible: '123'
      }
    }
  ]
}
const mockFeeAsset = 1
const mockSection: PolkadotXcmSection = 'limitedReserveTransferAssets'

describe('PolkadotXCMTransferImpl.transferPolkadotXCM', () => {
  it('should return serialized call structure when serializedApiCallEnabled is true', () => {
    const result = PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockHeader,
        addressSelection: mockAddressSelection,
        currencySelection: mockCurrencySelection,
        feeAsset: mockFeeAsset,
        serializedApiCallEnabled: true
      } as unknown as PolkadotXCMTransferInput,
      mockSection,
      { Limited: '1000' }
    )

    expect(result).toEqual({
      module: 'polkadotXcm',
      section: mockSection,
      parameters: [
        mockHeader,
        mockAddressSelection,
        mockCurrencySelection,
        mockFeeAsset,
        { Limited: '1000' }
      ]
    })
  })

  it('should call api.tx[module][section] with correct parameters when serializedApiCallEnabled is false and fees is undefined', () => {
    const callSpy = vi.spyOn(mockApi, 'call')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockHeader,
        addressSelection: mockAddressSelection,
        currencySelection: mockCurrencySelection,
        feeAsset: mockFeeAsset,
        serializedApiCallEnabled: false
      } as unknown as PolkadotXCMTransferInput,
      mockSection,
      undefined
    )

    expect(callSpy).toHaveBeenCalledWith({
      module: 'polkadotXcm',
      section: mockSection,
      parameters: [mockHeader, mockAddressSelection, mockCurrencySelection, mockFeeAsset]
    })
  })

  it('should call api.tx[module][section] with correct parameters when serializedApiCallEnabled is false and fees is "Unlimited"', () => {
    const callSpy = vi.spyOn(mockApi, 'call')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockHeader,
        addressSelection: mockAddressSelection,
        currencySelection: mockCurrencySelection,
        feeAsset: mockFeeAsset,
        serializedApiCallEnabled: false
      } as unknown as PolkadotXCMTransferInput,
      mockSection,
      'Unlimited'
    )

    expect(callSpy).toHaveBeenCalledWith({
      module: 'polkadotXcm',
      section: mockSection,
      parameters: [
        mockHeader,
        mockAddressSelection,
        mockCurrencySelection,
        mockFeeAsset,
        'Unlimited'
      ]
    })
  })

  it('should call api.tx[module][section] with correct parameters when serializedApiCallEnabled is false and fees is Limited', () => {
    const callSpy = vi.spyOn(mockApi, 'call')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockHeader,
        addressSelection: mockAddressSelection,
        currencySelection: mockCurrencySelection,
        feeAsset: mockFeeAsset,
        serializedApiCallEnabled: false
      } as unknown as PolkadotXCMTransferInput,
      mockSection,
      { Limited: '1000' }
    )

    expect(callSpy).toHaveBeenCalledWith({
      module: 'polkadotXcm',
      section: mockSection,
      parameters: [
        mockHeader,
        mockAddressSelection,
        mockCurrencySelection,
        mockFeeAsset,
        { Limited: '1000' }
      ]
    })
  })
})
