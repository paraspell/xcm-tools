import type { TEdJsonMap, TNodeDotKsmWithRelayChains } from '../../types'
import * as edMapJson from '../../maps/existential-deposits.json' assert { type: 'json' }

const edMap = edMapJson as TEdJsonMap

/**
 * Retrieves the existential deposit value for a given node.
 *
 * @param node - The node for which to get the existential deposit.
 * @returns The existential deposit as a string if available; otherwise, null.
 */
export const getExistentialDeposit = (node: TNodeDotKsmWithRelayChains): string | null =>
  edMap[node]
