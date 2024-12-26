import { buildBeneficiaryInput } from './buildBeneficiaryInput'
import { Version } from '../../../types'
import type { TAssetClaimOptions } from '../../../types/TAssetClaim'

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
