import { isExternalChain, isRelayChain, type TChain, Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getChain } from '../getChain'

export const getChainVersion = <TApi, TRes, TSigner>(
  api: PolkadotApi<TApi, TRes, TSigner>,
  chain: TChain
): Version => {
  if (isRelayChain(chain) || isExternalChain(chain)) {
    return Version.V5
  }

  const customEntry = api._customCtx.customChains?.[chain]
  if (customEntry) return customEntry.xcmVersion

  return getChain<TApi, TRes, TSigner, typeof chain>(chain).version
}
