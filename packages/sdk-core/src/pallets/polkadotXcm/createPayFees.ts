import type { TAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { TWeight } from '../../../dist'

export const createPayFees = (version: Version, asset: TAsset, weight?: TWeight) => {
  if (version < Version.V5) {
    return [
      {
        BuyExecution: {
          fees: asset,
          weight_limit: weight
            ? { Limited: { ref_time: weight.refTime, proof_size: weight.proofSize } }
            : 'Unlimited'
        }
      }
    ]
  }

  return [
    {
      PayFees: {
        asset
      }
    },
    { RefundSurplus: undefined }
  ]
}
