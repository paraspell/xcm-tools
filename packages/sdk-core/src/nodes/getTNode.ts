import {
  NODE_NAMES_DOT_KSM,
  type TEcosystemType,
  type TNodeWithRelayChains
} from '@paraspell/sdk-common'

import { getNode } from '../utils'
import { getParaId } from './config'

/**
 * Retrieves the node name corresponding to a specified parachain ID.
 *
 * @param paraId - The parachain ID.
 * @returns The node name if found; otherwise, null.
 */
export const getTNode = (
  paraId: number,
  ecosystem: TEcosystemType
): TNodeWithRelayChains | null => {
  if (paraId === 0) {
    switch (ecosystem) {
      case 'polkadot':
        return 'Polkadot'
      case 'kusama':
        return 'Kusama'
      case 'westend':
        return 'Westend'
      case 'paseo':
        return 'Paseo'
    }
  }

  if (paraId === 1) {
    return 'Ethereum'
  }

  return (
    NODE_NAMES_DOT_KSM.find(
      nodeName => getNode(nodeName).type === ecosystem && getParaId(nodeName) === paraId
    ) ?? null
  )
}
