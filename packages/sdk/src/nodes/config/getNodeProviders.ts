import type { TNodeDotKsmWithRelayChains } from '../../types'
import { getNodeConfig } from './getNodeConfig'

export const getNodeProviders = (node: TNodeDotKsmWithRelayChains): string[] => {
  const { providers } = getNodeConfig(node)
  if (providers.length === 0) {
    throw new Error(`No providers found for node ${node}`)
  }
  return providers.map(p => p.endpoint)
}
