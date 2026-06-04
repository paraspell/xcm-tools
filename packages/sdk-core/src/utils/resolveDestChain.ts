import type { TParachain, TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api'
import { getTChain } from '../chains/getTChain'
import { getRelayChainOfImpl } from './chain'

export const resolveDestChain = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  originChain: TSubstrateChain | TCustomChain,
  paraId: number | undefined
) => {
  return paraId !== undefined
    ? (getTChain(paraId, getRelayChainOfImpl(api, originChain)) as TParachain)
    : undefined
}
