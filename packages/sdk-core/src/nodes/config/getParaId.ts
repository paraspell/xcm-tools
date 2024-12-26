import type { TNodeDotKsmWithRelayChains } from '../../types'
import { getNodeConfig } from './getNodeConfig'

/**
 * Retrieves the parachain ID for a specified node.
 *
 * @param node - The node for which to get the paraId.
 * @returns The parachain ID of the node.
 */
export const getParaId = (node: TNodeDotKsmWithRelayChains): number => getNodeConfig(node).paraId
