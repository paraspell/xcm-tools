import type { TChain, TExternalChain, TRelaychain, TSubstrateChain } from '@paraspell/sdk-common'
import { CHAINS, isExternalChain } from '@paraspell/sdk-common'

import { getChain } from '../utils'
import { getParaId } from './config'

/**
 * Retrieves the chain name corresponding to a specified parachain ID.
 *
 * @param paraId - The parachain ID.
 * @returns The chain name if found; otherwise, null.
 */
export const getTChain = (paraId: number, ecosystem: TRelaychain | TExternalChain): TChain | null =>
  CHAINS.find(
    chain =>
      getParaId(chain) === paraId &&
      (getChain(chain).ecosystem === ecosystem || chain === ecosystem)
  ) ?? null

/**
 * Retrieves the substrate chain name corresponding to a specified parachain ID.
 *
 * @param paraId - The parachain ID.
 * @returns The substrate chain name if found; otherwise, null.
 */
export const getTSubstrateChain = (
  paraId: number,
  ecosystem: TRelaychain
): TSubstrateChain | null => {
  const chain = getTChain(paraId, ecosystem)
  return chain && !isExternalChain(chain) ? chain : null
}
