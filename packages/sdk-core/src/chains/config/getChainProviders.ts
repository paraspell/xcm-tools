import type { TSubstrateChain } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import { getChainConfig } from './getChainConfig'

export const getChainProviders = (chain: TSubstrateChain): string[] => {
  const { providers } = getChainConfig(chain)

  if (providers.length === 0) {
    throw new InvalidParameterError(`No providers found for chain ${chain}`)
  }

  // Prefer Dwellir provider
  providers.sort((a, b) => (a.name === 'Dwellir' ? 0 : 1) - (b.name === 'Dwellir' ? 0 : 1))

  return providers.map(p => p.endpoint)
}
