import { ETH_PARA_ID } from '../../constants'
import type { TNodeWithRelayChains } from '../../types'
import { getNodeConfig } from './getNodeConfig'

/**
 * Retrieves the parachain ID for a specified node.
 *
 * @param node - The node for which to get the paraId.
 * @returns The parachain ID of the node.
 */
export const getParaId = (node: TNodeWithRelayChains): number => {
  if (node === 'Ethereum') {
    return ETH_PARA_ID
  }

  return getNodeConfig(node).paraId
}
