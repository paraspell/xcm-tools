import type { TChain } from '@paraspell/sdk-common'
import { isRelayChain, Parents, type TLocation } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'

export const getChainLocation = (chain: TChain, destChain: TChain): TLocation => {
  const fromRelay = isRelayChain(chain)
  const toRelay = isRelayChain(destChain)

  const parents = fromRelay ? Parents.ZERO : Parents.ONE

  const interior = toRelay ? 'Here' : { X1: [{ Parachain: getParaId(destChain) }] }

  return { parents, interior }
}
