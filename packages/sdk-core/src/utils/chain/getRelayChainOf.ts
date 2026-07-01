import { isCustomChain, type TRelaychain, type TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { CustomChainInvalidError } from '../../errors'
import { getChain } from '../getChain'

/**
 * Gets the relay chain (Polkadot, Kusama, Westend, or Paseo) of a given chain.
 *
 * @param chain - The chain to evaluate.
 * @returns The corresponding relay chain.
 */
export const getRelayChainOf = (chain: TSubstrateChain): TRelaychain => getChain(chain).ecosystem

export const getRelayChainOfImpl = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  chain: TSubstrateChain | TCustomChain
): TRelaychain => {
  if (isCustomChain(chain)) {
    const customEntry = api._customCtx.customChains?.[chain]
    if (customEntry) return customEntry.ecosystem
    throw new CustomChainInvalidError(`Custom chain '${chain}' is not registered.`)
  }
  return getChain(chain).ecosystem
}
