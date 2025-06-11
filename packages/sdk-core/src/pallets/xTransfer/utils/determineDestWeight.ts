import type { TNodeWithRelayChains } from '@paraspell/sdk-common'

import { NodeNotSupportedError } from '../../../errors'
import type { TDestWeight } from '../../../types'

export const determineDestWeight = (destNode: TNodeWithRelayChains): TDestWeight | never => {
  if (destNode === 'Astar') {
    return { ref_time: 6000000000n, proof_size: 1000000n }
  }

  if (destNode === 'Moonbeam' || destNode === 'Hydration') {
    return { ref_time: 5000000000n, proof_size: 0n }
  }

  throw new NodeNotSupportedError(`Pallet XTransfer does not support transfering to ${destNode}.`)
}
