import { isRelayChain, type TNodeWithRelayChains, Version } from '@paraspell/sdk-common'

import { getNode } from '../getNode'

export const getChainVersion = <TApi, TRes>(chain: TNodeWithRelayChains): Version => {
  if (isRelayChain(chain) || chain === 'Ethereum') {
    return Version.V5
  }

  return getNode<TApi, TRes, typeof chain>(chain).version
}
