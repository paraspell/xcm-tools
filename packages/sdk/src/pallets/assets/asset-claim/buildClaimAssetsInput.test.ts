import { describe, it, expect, vi } from 'vitest'
import { buildClaimAssetsInput } from './buildClaimAssetsInput'
import { buildBeneficiaryInput } from './buildBeneficiaryInput'
import type { TMultiAsset } from '../../../types'
import { Version } from '../../../types'
import type { TAssetClaimOptionsInternal } from '../../../types/TAssetClaim'
import type { ApiPromise } from '@polkadot/api'

vi.mock('./buildBeneficiaryInput', () => ({
  buildBeneficiaryInput: vi.fn()
}))

describe('buildClaimAssetsInput', () => {
  const apiMock = {} as ApiPromise

  it('should build claim assets input with default version (V3)', () => {
    const multiAssets = ['asset1', 'asset2'] as unknown as TMultiAsset[]
    const address = 'somePolkadotAddress'
    const beneficiaryInput = { parents: 1, interior: {} }
    vi.mocked(buildBeneficiaryInput).mockReturnValue(beneficiaryInput)

    const options: TAssetClaimOptionsInternal = {
      node: 'Acala',
      api: apiMock,
      multiAssets,
      address
    }

    const result = buildClaimAssetsInput(options)

    expect(result).toEqual([{ [Version.V3]: multiAssets }, { [Version.V3]: beneficiaryInput }])
    expect(buildBeneficiaryInput).toHaveBeenCalledWith(apiMock, address)
  })

  it('should build claim assets input with a specified version', () => {
    const multiAssets = ['asset1', 'asset2'] as unknown as TMultiAsset[]
    const address = 'anotherAddress'
    const beneficiaryInput = { parents: 1, interior: {} }
    vi.mocked(buildBeneficiaryInput).mockReturnValue(beneficiaryInput)

    const options: TAssetClaimOptionsInternal = {
      node: 'Acala',
      api: apiMock,
      multiAssets,
      address,
      version: Version.V2
    }

    const result = buildClaimAssetsInput(options)

    expect(result).toEqual([{ [Version.V2]: multiAssets }, { [Version.V2]: beneficiaryInput }])
    expect(buildBeneficiaryInput).toHaveBeenCalledWith(apiMock, address)
  })

  it('should build claim assets input with empty multiAssets', () => {
    const multiAssets: TMultiAsset[] = []
    const address = 'yetAnotherAddress'
    const beneficiaryInput = { parents: 1, interior: {} }
    vi.mocked(buildBeneficiaryInput).mockReturnValue(beneficiaryInput)

    const options: TAssetClaimOptionsInternal = {
      node: 'Acala',
      api: apiMock,
      multiAssets,
      address
    }

    const result = buildClaimAssetsInput(options)

    expect(result).toEqual([{ [Version.V3]: multiAssets }, { [Version.V3]: beneficiaryInput }])
    expect(buildBeneficiaryInput).toHaveBeenCalledWith(apiMock, address)
  })
})
