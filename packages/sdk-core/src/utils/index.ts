// Contains important call creation utils (Selection of fees,formating of header and more.. )

import { getRelayChainSymbol } from '@paraspell/assets'
import type { TNodeWithRelayChains } from '@paraspell/sdk-common'

import type { TRelaychain } from '../types'

/**
 * Determines the relay chain for a given node.
 *
 * @param node - The node for which to determine the relay chain.
 * @returns 'Kusama' if the node's relay chain symbol is 'KSM'; otherwise, 'Polkadot'.
 */
export const determineRelayChain = (node: TNodeWithRelayChains): TRelaychain =>
  getRelayChainSymbol(node) === 'KSM' ? 'Kusama' : 'Polkadot'

export { createApiInstanceForNode } from './createApiInstanceForNode'
export * from './createVersionedBeneficiary'
export { createX1Payload } from './createX1Payload'
export * from './dryRun'
export { generateAddressMultiLocationV4 } from './generateAddressMultiLocationV4'
export { getFees } from './getFees'
export { getNode } from './getNode'
export * from './multiLocation'
export * from './resolveParaId'
export * from './validateAddress'
