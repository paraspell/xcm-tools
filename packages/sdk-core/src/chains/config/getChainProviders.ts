import type { TSubstrateChain } from '@paraspell/sdk-common'

import { ProviderUnavailableError } from '../../errors'
import type { TFullCustomCtx } from '../../types'
import { getChainConfigImpl } from './getChainConfig'

export const getChainProvidersImpl = <TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain,
  ctx?: TFullCustomCtx
): string[] => {
  const { providers } = getChainConfigImpl(chain, ctx)

  if (providers.length === 0) {
    throw new ProviderUnavailableError(`No providers found for chain ${chain}`)
  }

  // Prefer Dwellir provider
  // TODO: Look into this - check whether preferring Dwellir is still up to date for other chains
  if (chain !== 'Hydration') {
    providers.sort((a, b) => (a.name === 'Dwellir' ? 0 : 1) - (b.name === 'Dwellir' ? 0 : 1))
  }

  return providers.map(p => p.endpoint)
}

export const getChainProviders = (chain: TSubstrateChain): string[] => getChainProvidersImpl(chain)
