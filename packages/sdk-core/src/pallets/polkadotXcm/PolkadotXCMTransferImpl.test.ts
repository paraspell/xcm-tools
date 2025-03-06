import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type {
  TMultiAsset,
  TMultiLocation,
  TPolkadotXcmSection,
  TPolkadotXCMTransferOptions,
  TXcmVersioned
} from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from './PolkadotXCMTransferImpl'

const mockApi = {
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

const mockVersionedMultiLocation: TXcmVersioned<TMultiLocation> = {
  [Version.V4]: {
    parents: 0,
    interior: {
      Here: null
    }
  }
}

const mockCurrencySelection: TXcmVersioned<TMultiAsset[]> = {
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
        header: mockVersionedMultiLocation,
        addressSelection: mockVersionedMultiLocation,
        currencySelection: mockCurrencySelection
      } as TPolkadotXCMTransferOptions<unknown, unknown>,
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
        beneficiary: mockVersionedMultiLocation,
        dest: mockVersionedMultiLocation,
        fee_asset_item: 0
      }
    })
  })

  it('should call api.tx[module][section] with correct parameters when fees is "Unlimited"', () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockVersionedMultiLocation,
        addressSelection: mockVersionedMultiLocation,
        currencySelection: mockCurrencySelection
      } as TPolkadotXCMTransferOptions<unknown, unknown>,
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
        beneficiary: mockVersionedMultiLocation,
        dest: mockVersionedMultiLocation,
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
        header: mockVersionedMultiLocation,
        addressSelection: mockVersionedMultiLocation,
        currencySelection: mockCurrencySelection
      } as TPolkadotXCMTransferOptions<unknown, unknown>,
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
        beneficiary: mockVersionedMultiLocation,
        dest: mockVersionedMultiLocation,
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
        header: mockVersionedMultiLocation,
        addressSelection: mockVersionedMultiLocation,
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
      } as TPolkadotXCMTransferOptions<unknown, unknown>,
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
        beneficiary: mockVersionedMultiLocation,
        dest: mockVersionedMultiLocation,
        fee_asset_item: 1
      }
    })
  })
})
