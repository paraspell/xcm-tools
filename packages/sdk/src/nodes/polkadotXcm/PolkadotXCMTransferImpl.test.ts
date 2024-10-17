import { describe, it, expect, vi } from 'vitest'
import PolkadotXCMTransferImpl from './PolkadotXCMTransferImpl'
import type {
  PolkadotXcmSection,
  PolkadotXCMTransferInput,
  TCurrencySelectionHeaderArr,
  TMultiLocationHeader
} from '../../types'
import { Version } from '../../types'
import type { ApiPromise } from '@polkadot/api'
import type PolkadotJsApi from '../../pjs/PolkadotJsApi'
import type { Extrinsic } from '../../pjs/types'

const mockApi = {
  callTxMethod: vi.fn()
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
const mockSection: PolkadotXcmSection = 'limited_reserve_transfer_assets'

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
      } as unknown as PolkadotXCMTransferInput<ApiPromise, Extrinsic>,
      mockSection,
      { Limited: '1000' }
    )

    expect(result).toEqual({
      module: 'PolkadotXcm',
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
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockHeader,
        addressSelection: mockAddressSelection,
        currencySelection: mockCurrencySelection,
        feeAsset: mockFeeAsset,
        serializedApiCallEnabled: false
      } as unknown as PolkadotXCMTransferInput<ApiPromise, Extrinsic>,
      mockSection,
      undefined
    )

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      section: mockSection,
      parameters: {
        assets: {
          V4: [
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
        },
        beneficiary: mockAddressSelection,
        dest: mockHeader,
        fee_asset_item: mockFeeAsset
      }
    })
  })

  it('should call api.tx[module][section] with correct parameters when serializedApiCallEnabled is false and fees is "Unlimited"', () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockHeader,
        addressSelection: mockAddressSelection,
        currencySelection: mockCurrencySelection,
        feeAsset: mockFeeAsset,
        serializedApiCallEnabled: false
      } as unknown as PolkadotXCMTransferInput<ApiPromise, Extrinsic>,
      mockSection,
      'Unlimited'
    )

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      section: mockSection,
      parameters: {
        assets: {
          V4: [
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
        },
        beneficiary: mockAddressSelection,
        dest: mockHeader,
        fee_asset_item: mockFeeAsset,
        weight_limit: 'Unlimited'
      }
    })
  })

  it('should call api.tx[module][section] with correct parameters when serializedApiCallEnabled is false and fees is Limited', () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockHeader,
        addressSelection: mockAddressSelection,
        currencySelection: mockCurrencySelection,
        feeAsset: mockFeeAsset,
        serializedApiCallEnabled: false
      } as unknown as PolkadotXCMTransferInput<ApiPromise, Extrinsic>,
      mockSection,
      { Limited: '1000' }
    )

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      section: mockSection,
      parameters: {
        assets: {
          V4: [
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
        },
        beneficiary: mockAddressSelection,
        dest: mockHeader,
        fee_asset_item: mockFeeAsset,
        weight_limit: { Limited: '1000' }
      }
    })
  })
})
