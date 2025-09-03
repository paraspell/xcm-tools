import type { TParachain, TSubstrateChain } from '@paraspell/sdk-common'

import { getTChain } from '../chains/getTChain'
import { getRelayChainOf } from './chain'

export const resolveDestChain = (originChain: TSubstrateChain, paraId: number | undefined) => {
  return paraId !== undefined
    ? (getTChain(paraId, getRelayChainOf(originChain)) as TParachain)
    : undefined
}
