import type { TAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TAssetClaimInternalOptions } from '../../types'
import { addXcmVersionHeader, createBeneficiaryLocation } from '../../utils'
import { buildClaimAssetsParams } from './buildClaimAssetsParams'

vi.mock('../../utils')

describe('buildClaimAssetsParams', () => {
  const apiMock = {} as unknown as IPolkadotApi<unknown, unknown>

  it('should build claim assets input with a specified version', () => {
    const version = Version.V5
    const multiAssets = ['asset1', 'asset2'] as unknown as TAsset[]
    const address = 'anotherAddress'
    const beneficiaryInput = { parents: 1, interior: {} }
    const versionedAssets = { [version]: multiAssets }
    const versionedBeneficiary = { [version]: beneficiaryInput }

    vi.mocked(createBeneficiaryLocation).mockReturnValue(beneficiaryInput)
    vi.mocked(addXcmVersionHeader).mockImplementation((data, version) => ({
      [version]: data
    }))

    const options: TAssetClaimInternalOptions<unknown, unknown> = {
      chain: 'Acala',
      api: apiMock,
      currency: [],
      assets: multiAssets,
      address,
      version
    }

    const result = buildClaimAssetsParams(options)

    expect(result).toEqual({
      assets: versionedAssets,
      beneficiary: versionedBeneficiary
    })
    expect(createBeneficiaryLocation).toHaveBeenCalledWith(options)
    expect(addXcmVersionHeader).toHaveBeenCalledWith(multiAssets, version)
    expect(addXcmVersionHeader).toHaveBeenCalledWith(beneficiaryInput, version)
  })

  it('should build claim assets input with empty multiAssets', () => {
    const version = Version.V5
    const multiAssets: TAsset[] = []
    const address = 'yetAnotherAddress'
    const beneficiaryInput = { parents: 1, interior: {} }
    const versionedAssets = { [version]: multiAssets }
    const versionedBeneficiary = { [version]: beneficiaryInput }

    vi.mocked(createBeneficiaryLocation).mockReturnValue(beneficiaryInput)
    vi.mocked(addXcmVersionHeader).mockImplementation((data, version) => ({
      [version]: data
    }))

    const options: TAssetClaimInternalOptions<unknown, unknown> = {
      chain: 'Acala',
      api: apiMock,
      currency: [],
      assets: multiAssets,
      version,
      address
    }

    const result = buildClaimAssetsParams(options)

    expect(result).toEqual({
      assets: versionedAssets,
      beneficiary: versionedBeneficiary
    })
    expect(createBeneficiaryLocation).toHaveBeenCalledWith(options)
    expect(addXcmVersionHeader).toHaveBeenCalledWith(multiAssets, version)
    expect(addXcmVersionHeader).toHaveBeenCalledWith(beneficiaryInput, version)
  })
})
