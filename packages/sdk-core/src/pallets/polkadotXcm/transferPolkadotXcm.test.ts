import type { TAsset, TAssetInfo, WithAmount } from '@paraspell/assets'
import { type TLocation, Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TPolkadotXcmMethod, TPolkadotXCMTransferOptions, TXcmVersioned } from '../../types'
import { transferPolkadotXcm } from './transferPolkadotXcm'

const mockApi = {
  deserializeExtrinsics: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

const mockLocation: TLocation = {
  parents: 0,
  interior: {
    Here: null
  }
}

const mockAsset: TAsset = {
  id: mockLocation,
  fun: {
    Fungible: 123n
  }
}

const mockVersionedLocation: TXcmVersioned<TLocation> = {
  [Version.V4]: mockLocation
}

const mockVersionedAssets: TXcmVersioned<TAsset[]> = {
  [Version.V4]: [mockAsset]
}

const mockMethod: TPolkadotXcmMethod = 'limited_reserve_transfer_assets'

describe('transferPolkadotXcm', () => {
  const baseOptions = {
    api: mockApi,
    destLocation: mockLocation,
    beneficiaryLocation: mockLocation,
    asset: mockAsset,
    assetInfo: { amount: 123n } as WithAmount<TAssetInfo>,
    version: Version.V4
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  it('should call api.tx[module][method] with correct parameters when fees is undefined', async () => {
    const callSpy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    await transferPolkadotXcm(baseOptions, mockMethod, undefined)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: mockMethod,
      params: {
        assets: mockVersionedAssets,
        beneficiary: mockVersionedLocation,
        dest: mockVersionedLocation,
        fee_asset_item: 0
      }
    })
  })

  it('should call api.tx[module][method] with correct parameters when fees is "Unlimited"', async () => {
    const callSpy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    await transferPolkadotXcm(baseOptions, mockMethod, 'Unlimited')

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: mockMethod,
      params: {
        assets: mockVersionedAssets,
        beneficiary: mockVersionedLocation,
        dest: mockVersionedLocation,
        fee_asset_item: 0,
        weight_limit: 'Unlimited'
      }
    })
  })

  it('should call api.tx[module][method] with correct parameters when fees is Limited', async () => {
    const callSpy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    await transferPolkadotXcm(baseOptions, mockMethod, { Limited: '1000' })

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: mockMethod,
      params: {
        assets: mockVersionedAssets,
        beneficiary: mockVersionedLocation,
        dest: mockVersionedLocation,
        fee_asset_item: 0,
        weight_limit: { Limited: '1000' }
      }
    })
  })
})
