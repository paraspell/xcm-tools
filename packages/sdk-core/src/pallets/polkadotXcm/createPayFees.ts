import type { TAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { TWeight } from '../../types'

export const createPayFees = (
  version: Version,
  asset: TAsset,
  weight?: TWeight,
  includeRefundSurplus = true
) => {
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
    ...(includeRefundSurplus ? [{ RefundSurplus: undefined }] : [])
  ]
}
