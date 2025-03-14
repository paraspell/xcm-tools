import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { shuffleArray } from './shuffleArray'

export const shuffleWsProviders = (node: TNodeDotKsmWithRelayChains, wsProviders: string[]) => {
  const ALLOWED_NODES: TNodeDotKsmWithRelayChains[] = ['Hydration', 'Acala']
  if (ALLOWED_NODES.includes(node)) {
    return shuffleArray(wsProviders)
  }
  return wsProviders
}
