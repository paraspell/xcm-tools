import type { TNodeDotKsmWithRelayChains } from '../types'
import { shuffleArray } from './shuffleArray'

export const shuffleWsProviders = (node: TNodeDotKsmWithRelayChains, wsProviders: string[]) => {
  const ALLOWED_NODES: TNodeDotKsmWithRelayChains[] = ['Hydration', 'Acala']
  if (ALLOWED_NODES.includes(node)) {
    return shuffleArray(wsProviders)
  }
  return wsProviders
}
