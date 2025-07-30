import { isRelayChain, type TChain, Version } from '@paraspell/sdk-common'

import { getChain } from '../getChain'

export const getChainVersion = <TApi, TRes>(chain: TChain): Version => {
  if (isRelayChain(chain) || chain === 'Ethereum') {
    return Version.V5
  }

  return getChain<TApi, TRes, typeof chain>(chain).version
}
