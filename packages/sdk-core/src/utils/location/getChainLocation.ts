import type { TChain } from '@paraspell/sdk-common'
import { isRelayChain, Parents, type TLocation } from '@paraspell/sdk-common'

import { getParaIdImpl } from '../../chains/config'
import type { TFullCustomCtx } from '../../types'

export const getChainLocation = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  destChain: TChain | TCustomChain,
  customCtx?: TFullCustomCtx
): TLocation => {
  const fromRelay = isRelayChain(chain)
  const toRelay = isRelayChain(destChain)

  const parents = fromRelay ? Parents.ZERO : Parents.ONE

  const interior = toRelay ? 'Here' : { X1: [{ Parachain: getParaIdImpl(destChain, customCtx) }] }

  return { parents, interior }
}
