import { buildBeneficiaryInput } from './buildBeneficiaryInput'
import { Version } from '../../../types'
import type { TAssetClaimOptions } from '../../../types/TAssetClaim'
import type { ApiPromise } from '@polkadot/api'

export const buildClaimAssetsInput = ({
  api,
  multiAssets,
  address,
  version = Version.V3
}: TAssetClaimOptions) => [
  {
    [version]: multiAssets
  },
  {
    [version]: buildBeneficiaryInput(api as ApiPromise, address)
  }
]
