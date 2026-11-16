import type { TChain, TExternalChain, TRelaychain, TSubstrateChain } from '@paraspell/sdk-common'
import { CHAINS, isExternalChain } from '@paraspell/sdk-common'

import type { TFullCustomCtx } from '../types'
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
 * Resolves a chain by parachain ID and ecosystem, checking built-in chains before custom chains.
 *
 * @param paraId - The parachain ID.
 * @param ecosystem - The ecosystem containing the chain.
 * @param ctx - The hydrated custom-chain context.
 * @returns The matching chain name, or null if no chain is registered.
 */
export const getTChainImpl = <TCustomChain extends string = never>(
  paraId: number,
  ecosystem: TRelaychain | TExternalChain,
  ctx?: TFullCustomCtx
): TChain | TCustomChain | null => {
  const builtInChain = getTChain(paraId, ecosystem)
  if (builtInChain) return builtInChain

  const customChain = Object.values(ctx?.customChains ?? {}).find(
    entry => entry.paraId === paraId && entry.ecosystem === ecosystem
  )
  return customChain ? (customChain.name as TCustomChain) : null
}

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
