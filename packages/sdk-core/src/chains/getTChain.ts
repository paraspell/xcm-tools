import type { TChain, TExternalChain, TRelaychain } from '@paraspell/sdk-common'
import { PARACHAINS } from '@paraspell/sdk-common'

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
  ecosystem: TRelaychain | TExternalChain
): TChain | null => {
  if (paraId === 0) {
    return ecosystem
  }

  if (paraId === 1) {
    return 'Ethereum'
  }

  return (
    PARACHAINS.find(
      chain => getChain(chain).ecosystem === ecosystem && getParaId(chain) === paraId
    ) ?? null
  )
}
