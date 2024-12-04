import { describe, it, expect, vi } from 'vitest'
import PolkadotXCMTransferImpl from './PolkadotXCMTransferImpl'
import type {
  TPolkadotXcmSection,
  TPolkadotXCMTransferOptions,
  TCurrencySelectionHeaderArr,
  TMultiLocationHeader
} from '../../types'
import { Version } from '../../types'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic, TPjsApi } from '../../pjs/types'
import type { IPolkadotApi } from '../../api'

const mockApi = {
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<TPjsApi, Extrinsic>

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

const mockSection: TPolkadotXcmSection = 'limited_reserve_transfer_assets'

describe('PolkadotXCMTransferImpl.transferPolkadotXCM', () => {
  it('should call api.tx[module][section] with correct parameters when fees is undefined', () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockHeader,
        addressSelection: mockAddressSelection,
        currencySelection: mockCurrencySelection
      } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>,
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
        fee_asset_item: 0
      }
    })
  })

  it('should call api.tx[module][section] with correct parameters when fees is "Unlimited"', () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockHeader,
        addressSelection: mockAddressSelection,
        currencySelection: mockCurrencySelection
      } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>,
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
        fee_asset_item: 0,
        weight_limit: 'Unlimited'
      }
    })
  })

  it('should call api.tx[module][section] with correct parameters when fees is Limited', () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockHeader,
        addressSelection: mockAddressSelection,
        currencySelection: mockCurrencySelection
      } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>,
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
        fee_asset_item: 0,
        weight_limit: { Limited: '1000' }
      }
    })
  })

  it('should call api.tx[module][section] with correct parameters when overridedCurrency is provided', () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockHeader,
        addressSelection: mockAddressSelection,
        currencySelection: mockCurrencySelection,
        overriddenAsset: [
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
          },
          {
            isFeeAsset: true,
            id: {
              parents: 0,
              interior: {
                Here: null
              }
            },
            fun: {
              Fungible: '456'
            }
          }
        ]
      } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>,
      mockSection
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
        fee_asset_item: 1
      }
    })
  })
})
