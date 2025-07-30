import {
  CHAIN_NAMES_DOT_KSM,
  type TEcosystemType,
  type TChainWithRelayChains
} from '@paraspell/sdk-common'

import { getChain } from '../utils'
import { getParaId } from './config'

/**
 * Retrieves the chain name corresponding to a specified parachain ID.
 *
 * @param paraId - The parachain ID.
 * @returns The chain name if found; otherwise, null.
 */
export const getTChain = (
  paraId: number,
  ecosystem: TEcosystemType
): TChainWithRelayChains | null => {
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
    CHAIN_NAMES_DOT_KSM.find(
      chain => getChain(chain).type === ecosystem && getParaId(chain) === paraId
    ) ?? null
  )
}
