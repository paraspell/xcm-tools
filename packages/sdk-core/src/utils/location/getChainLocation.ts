import {
  isRelayChain,
  Parents,
  type TLocation,
  type TNodeWithRelayChains
} from '@paraspell/sdk-common'

import { getParaId } from '../../nodes/config'

export const getChainLocation = (
  chain: TNodeWithRelayChains,
  destChain: TNodeWithRelayChains
): TLocation => {
  const fromRelay = isRelayChain(chain)
  const toRelay = isRelayChain(destChain)

  const parents = fromRelay ? Parents.ZERO : Parents.ONE

  const interior = toRelay ? 'Here' : { X1: [{ Parachain: getParaId(destChain) }] }

  return { parents, interior }
}
