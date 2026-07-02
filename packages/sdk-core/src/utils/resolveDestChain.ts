import type { TParachain, TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api'
import { getTChain } from '../chains/getTChain'

export const resolveDestChain = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  originChain: TSubstrateChain | TCustomChain,
  paraId: number | undefined
) => {
  return paraId !== undefined
    ? (getTChain(paraId, api.getRelayChainOf(originChain)) as TParachain)
    : undefined
}
