import { Version } from '@paraspell/sdk-common'

import type { TAssetClaimOptions } from '../../../types/TAssetClaim'
import { buildBeneficiaryInput } from './buildBeneficiaryInput'

export const buildClaimAssetsInput = <TApi, TRes>({
  api,
  multiAssets,
  address,
  version = Version.V4
}: TAssetClaimOptions<TApi, TRes>) => ({
  assets: {
    [version]: multiAssets
  },
  beneficiary: {
    [version]: buildBeneficiaryInput(api, address)
  }
})
