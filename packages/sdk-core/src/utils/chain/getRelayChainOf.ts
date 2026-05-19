import { isRelayChain, type TRelaychain, type TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getChain } from '../getChain'

/**
 * Gets the relay chain (Polkadot, Kusama, Westend, or Paseo) of a given chain.
 *
 * @param chain - The chain to evaluate.
 * @returns The corresponding relay chain.
 */
export const getRelayChainOf = (chain: TSubstrateChain): TRelaychain => {
  if (isRelayChain(chain)) return chain
  return getChain(chain).ecosystem
}

export const getRelayChainOfImpl = <TApi, TRes, TSigner>(
  api: PolkadotApi<TApi, TRes, TSigner>,
  chain: TSubstrateChain
): TRelaychain => {
  if (isRelayChain(chain)) return chain
  const customEntry = api._customCtx.customChains?.[chain]
  if (customEntry) return customEntry.ecosystem
  return getChain(chain).ecosystem
}
