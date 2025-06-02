import type { TMultiAsset } from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TPolkadotXcmMethod, TPolkadotXCMTransferOptions, TXcmVersioned } from '../../types'
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

const mockMethod: TPolkadotXcmMethod = 'limited_reserve_transfer_assets'

describe('PolkadotXCMTransferImpl.transferPolkadotXCM', () => {
  it('should call api.tx[module][method] with correct parameters when fees is undefined', () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        header: mockVersionedMultiLocation,
        addressSelection: mockVersionedMultiLocation,
        currencySelection: mockCurrencySelection,
        asset: { amount: '123' }
      } as TPolkadotXCMTransferOptions<unknown, unknown>,
      mockMethod,
      undefined
    )

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: mockMethod,
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

  it('should call api.tx[module][method] with correct parameters when fees is "Unlimited"', () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        asset: { amount: '123' },
        header: mockVersionedMultiLocation,
        addressSelection: mockVersionedMultiLocation,
        currencySelection: mockCurrencySelection
      } as TPolkadotXCMTransferOptions<unknown, unknown>,
      mockMethod,
      'Unlimited'
    )

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: mockMethod,
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

  it('should call api.tx[module][method] with correct parameters when fees is Limited', () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    PolkadotXCMTransferImpl.transferPolkadotXCM(
      {
        api: mockApi,
        asset: { amount: '123' },
        header: mockVersionedMultiLocation,
        addressSelection: mockVersionedMultiLocation,
        currencySelection: mockCurrencySelection
      } as TPolkadotXCMTransferOptions<unknown, unknown>,
      mockMethod,
      { Limited: '1000' }
    )

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: mockMethod,
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
})
