import type { TAsset } from '@paraspell/assets'

import type { TWeight } from '../../types'

export const createBuyExecution = (asset: TAsset, weight?: TWeight) => [
  {
    BuyExecution: {
      fees: asset,
      weight_limit: weight
        ? { Limited: { ref_time: weight.refTime, proof_size: weight.proofSize } }
        : 'Unlimited'
    }
  }
]
