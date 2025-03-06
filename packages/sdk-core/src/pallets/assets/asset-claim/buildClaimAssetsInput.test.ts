import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { TMultiAsset } from '../../../types'
import { Version } from '../../../types'
import type { TAssetClaimOptions } from '../../../types/TAssetClaim'
import { buildBeneficiaryInput } from './buildBeneficiaryInput'
import { buildClaimAssetsInput } from './buildClaimAssetsInput'

vi.mock('./buildBeneficiaryInput', () => ({
  buildBeneficiaryInput: vi.fn()
}))

describe('buildClaimAssetsInput', () => {
  const apiMock = {} as unknown as IPolkadotApi<unknown, unknown>

  it('should build claim assets input with default version (V3)', () => {
    const multiAssets = ['asset1', 'asset2'] as unknown as TMultiAsset[]
    const address = 'somePolkadotAddress'
    const beneficiaryInput = { parents: 1, interior: {} }
    vi.mocked(buildBeneficiaryInput).mockReturnValue(beneficiaryInput)

    const options: TAssetClaimOptions<unknown, unknown> = {
      node: 'Acala',
      api: apiMock,
      multiAssets,
      address
    }

    const result = buildClaimAssetsInput(options)

    expect(result).toEqual({
      assets: { [Version.V3]: multiAssets },
      beneficiary: { [Version.V3]: beneficiaryInput }
    })
    expect(buildBeneficiaryInput).toHaveBeenCalledWith(apiMock, address)
  })

  it('should build claim assets input with a specified version', () => {
    const multiAssets = ['asset1', 'asset2'] as unknown as TMultiAsset[]
    const address = 'anotherAddress'
    const beneficiaryInput = { parents: 1, interior: {} }
    vi.mocked(buildBeneficiaryInput).mockReturnValue(beneficiaryInput)

    const options: TAssetClaimOptions<unknown, unknown> = {
      node: 'Acala',
      api: apiMock,
      multiAssets,
      address,
      version: Version.V2
    }

    const result = buildClaimAssetsInput(options)

    expect(result).toEqual({
      assets: { [Version.V2]: multiAssets },
      beneficiary: { [Version.V2]: beneficiaryInput }
    })
    expect(buildBeneficiaryInput).toHaveBeenCalledWith(apiMock, address)
  })

  it('should build claim assets input with empty multiAssets', () => {
    const multiAssets: TMultiAsset[] = []
    const address = 'yetAnotherAddress'
    const beneficiaryInput = { parents: 1, interior: {} }
    vi.mocked(buildBeneficiaryInput).mockReturnValue(beneficiaryInput)

    const options: TAssetClaimOptions<unknown, unknown> = {
      node: 'Acala',
      api: apiMock,
      multiAssets,
      address
    }

    const result = buildClaimAssetsInput(options)

    expect(result).toEqual({
      assets: { [Version.V3]: multiAssets },
      beneficiary: { [Version.V3]: beneficiaryInput }
    })
    expect(buildBeneficiaryInput).toHaveBeenCalledWith(apiMock, address)
  })
})
