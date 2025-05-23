import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import { getNodeConfig } from './getNodeConfig'

export const getNodeProviders = (node: TNodeDotKsmWithRelayChains): string[] => {
  const { providers } = getNodeConfig(node)
  if (providers.length === 0) {
    throw new InvalidParameterError(`No providers found for node ${node}`)
  }

  // Prefer Dwellir provider
  providers.sort((a, b) => (a.name === 'Dwellir' ? 0 : 1) - (b.name === 'Dwellir' ? 0 : 1))

  return providers.map(p => p.endpoint)
}
