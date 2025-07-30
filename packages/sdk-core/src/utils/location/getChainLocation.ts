import {
  isRelayChain,
  Parents,
  type TChainWithRelayChains,
  type TLocation
} from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'

export const getChainLocation = (
  chain: TChainWithRelayChains,
  destChain: TChainWithRelayChains
): TLocation => {
  const fromRelay = isRelayChain(chain)
  const toRelay = isRelayChain(destChain)

  const parents = fromRelay ? Parents.ZERO : Parents.ONE

  const interior = toRelay ? 'Here' : { X1: [{ Parachain: getParaId(destChain) }] }

  return { parents, interior }
}
