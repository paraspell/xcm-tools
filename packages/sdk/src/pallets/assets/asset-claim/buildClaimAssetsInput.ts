import { buildBeneficiaryInput } from './buildBeneficiaryInput'
import type { TApiType } from '../../../types'
import { Version } from '../../../types'
import type { TAssetClaimOptionsInternal } from '../../../types/TAssetClaim'

export const buildClaimAssetsInput = <TApi extends TApiType>({
  api,
  multiAssets,
  address,
  version = Version.V3
}: TAssetClaimOptionsInternal<TApi>) => [
  {
    [version]: multiAssets
  },
  {
    [version]: buildBeneficiaryInput(api, address)
  }
]
