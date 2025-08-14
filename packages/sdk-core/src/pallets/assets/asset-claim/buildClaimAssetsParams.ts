import type { TAssetClaimInternalOptions } from '../../../types/TAssetClaim'
import { addXcmVersionHeader, createBeneficiaryLocation } from '../../../utils'

export const buildClaimAssetsParams = <TApi, TRes>(
  options: TAssetClaimInternalOptions<TApi, TRes>
) => {
  const { assets, version } = options

  const beneficiary = createBeneficiaryLocation(options)

  return {
    assets: addXcmVersionHeader(assets, version),
    beneficiary: addXcmVersionHeader(beneficiary, version)
  }
}
