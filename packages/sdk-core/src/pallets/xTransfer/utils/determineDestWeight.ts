import { NodeNotSupportedError } from '../../../errors'
import type { TDestWeight, TNodeWithRelayChains } from '../../../types'

export const determineDestWeight = (destNode?: TNodeWithRelayChains): TDestWeight | never => {
  if (destNode === 'Astar') {
    return { refTime: '6000000000', proofSize: '1000000' }
  }

  if (destNode === 'Moonbeam' || destNode === 'Hydration') {
    return { refTime: '5000000000', proofSize: '0' }
  }

  throw new NodeNotSupportedError(`Node ${destNode} is not supported`)
}
