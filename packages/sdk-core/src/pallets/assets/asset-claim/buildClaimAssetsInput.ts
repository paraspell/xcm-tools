import { Version } from '../../../types'
import type { TAssetClaimOptions } from '../../../types/TAssetClaim'
import { buildBeneficiaryInput } from './buildBeneficiaryInput'

export const buildClaimAssetsInput = <TApi, TRes>({
  api,
  multiAssets,
  address,
  version = Version.V3
}: TAssetClaimOptions<TApi, TRes>) => ({
  assets: {
    [version]: multiAssets
  },
  beneficiary: {
    [version]: buildBeneficiaryInput(api, address)
  }
})
