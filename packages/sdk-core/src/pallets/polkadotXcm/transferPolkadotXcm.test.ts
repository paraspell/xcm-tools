import type { TAsset, TMultiAsset, WithAmount } from '@paraspell/assets'
import { type TMultiLocation, Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TPolkadotXcmMethod, TPolkadotXCMTransferOptions, TXcmVersioned } from '../../types'
import { transferPolkadotXcm } from './transferPolkadotXcm'

const mockApi = {
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

const mockMultiLocation: TMultiLocation = {
  parents: 0,
  interior: {
    Here: null
  }
}

const mockMultiAsset: TMultiAsset = {
  id: mockMultiLocation,
  fun: {
    Fungible: '123'
  }
}

const mockVersionedMultiLocation: TXcmVersioned<TMultiLocation> = {
  [Version.V4]: mockMultiLocation
}

const mockVersionedMultiAssets: TXcmVersioned<TMultiAsset[]> = {
  [Version.V4]: [mockMultiAsset]
}

const mockMethod: TPolkadotXcmMethod = 'limited_reserve_transfer_assets'

describe('transferPolkadotXcm', () => {
  const baseOptions = {
    api: mockApi,
    destLocation: mockMultiLocation,
    beneficiaryLocation: mockMultiLocation,
    multiAsset: mockMultiAsset,
    asset: { amount: '123' } as WithAmount<TAsset>,
    version: Version.V4
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  it('should call api.tx[module][method] with correct parameters when fees is undefined', async () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    await transferPolkadotXcm(baseOptions, mockMethod, undefined)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: mockMethod,
      parameters: {
        assets: mockVersionedMultiAssets,
        beneficiary: mockVersionedMultiLocation,
        dest: mockVersionedMultiLocation,
        fee_asset_item: 0
      }
    })
  })

  it('should call api.tx[module][method] with correct parameters when fees is "Unlimited"', async () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    await transferPolkadotXcm(baseOptions, mockMethod, 'Unlimited')

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: mockMethod,
      parameters: {
        assets: mockVersionedMultiAssets,
        beneficiary: mockVersionedMultiLocation,
        dest: mockVersionedMultiLocation,
        fee_asset_item: 0,
        weight_limit: 'Unlimited'
      }
    })
  })

  it('should call api.tx[module][method] with correct parameters when fees is Limited', async () => {
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    await transferPolkadotXcm(baseOptions, mockMethod, { Limited: '1000' })

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: mockMethod,
      parameters: {
        assets: mockVersionedMultiAssets,
        beneficiary: mockVersionedMultiLocation,
        dest: mockVersionedMultiLocation,
        fee_asset_item: 0,
        weight_limit: { Limited: '1000' }
      }
    })
  })
})
