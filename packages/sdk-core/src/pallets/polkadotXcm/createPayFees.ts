import type { TAsset } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'

import type { TWeight } from '../../types'

// PayFees instruction is removed temporarily in favor of BuyExecution everywhere,
// but we keep this function for now in case we need to add it back in the future
export const createPayFees = (_version: Version, asset: TAsset, weight?: TWeight) => [
  {
    BuyExecution: {
      fees: asset,
      weight_limit: weight
        ? { Limited: { ref_time: weight.refTime, proof_size: weight.proofSize } }
        : 'Unlimited'
    }
  }
]
