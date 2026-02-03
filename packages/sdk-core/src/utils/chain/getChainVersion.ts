import { isExternalChain, isRelayChain, type TChain, Version } from '@paraspell/sdk-common'

import { getChain } from '../getChain'

export const getChainVersion = <TApi, TRes, TSigner>(chain: TChain): Version => {
  if (isRelayChain(chain) || isExternalChain(chain)) {
    return Version.V5
  }

  return getChain<TApi, TRes, TSigner, typeof chain>(chain).version
}
