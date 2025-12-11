import type { TChain } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../../errors'
import type { TDestWeight } from '../../../types'

export const determineDestWeight = (destChain: TChain): TDestWeight | never => {
  if (destChain === 'Astar') {
    return { ref_time: 6000000000n, proof_size: 1000000n }
  }

  if (destChain === 'Moonbeam' || destChain === 'Hydration') {
    return { ref_time: 5000000000n, proof_size: 0n }
  }

  throw new ScenarioNotSupportedError(
    `Pallet XTransfer does not support transfering to ${destChain}.`
  )
}
