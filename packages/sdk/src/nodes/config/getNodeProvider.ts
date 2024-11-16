import type { TNodeDotKsmWithRelayChains } from '../../types'
import { getNode, isRelayChain } from '../../utils'
import { getNodeConfig } from './getNodeConfig'

export const getNodeProvider = (node: TNodeDotKsmWithRelayChains): string => {
  if (isRelayChain(node)) {
    const { providers } = getNodeConfig(node)
    if (providers.length === 0) {
      throw new Error(`No providers found for node ${node}`)
    }
    return providers[0].endpoint
  }

  return getNode(node).getProvider()
}
