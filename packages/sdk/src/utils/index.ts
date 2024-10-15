// Contains important call creation utils (Selection of fees,formating of header and more.. )

import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '../types'
import { getRelayChainSymbol } from '../pallets/assets'

/**
 * Determines the relay chain for a given node.
 *
 * @param node - The node for which to determine the relay chain.
 * @returns 'Kusama' if the node's relay chain symbol is 'KSM'; otherwise, 'Polkadot'.
 */
export const determineRelayChain = (node: TNodeWithRelayChains): TNodeDotKsmWithRelayChains =>
  getRelayChainSymbol(node) === 'KSM' ? 'Kusama' : 'Polkadot'

/**
 * Determines whether a given node is a relay chain (Polkadot or Kusama).
 *
 * @param node - The node to check.
 * @returns True if the node is 'Polkadot' or 'Kusama'; otherwise, false.
 */
export const isRelayChain = (node: TNodeWithRelayChains): boolean =>
  node === 'Polkadot' || node === 'Kusama'

export { createX1Payload } from './createX1Payload'
export { deepEqual } from './deepEqual'
export { generateAddressMultiLocationV4 } from './generateAddressMultiLocationV4'
export { generateAddressPayload } from './generateAddressPayload'
export { getNodeProvider } from './getNodeProvider'
export { getAllNodeProviders } from './getAllNodeProviders'
export { getFees } from './getFees'
export { verifyMultiLocation } from './verifyMultiLocation'
export { callPolkadotJsTxFunction } from './callPolkadotJsTxFunction'
export { getNode } from './getNode'
export { createApiInstanceForNode } from './createApiInstanceForNode'
export { getNodeEndpointOption } from './getNodeEndpointOption'
export { createApiInstance } from './createApiInstance'
export { determineRelayChainSymbol } from './determineRelayChainSymbol'
export { createAccountId } from './createAccountId'
