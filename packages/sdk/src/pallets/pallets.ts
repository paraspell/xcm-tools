// Script that pulls XCM Pallets for selected Parachain

import * as palletsMapJson from '../maps/pallets.json' assert { type: 'json' }
import type { TNodeDotKsmWithRelayChains, TNodePolkadotKusama } from '../types'
import { type TPallet, type TPalletJsonMap } from '../types'

const palletsMap = palletsMapJson as TPalletJsonMap

/**
 * Retrieves the default pallet for a specified node.
 *
 * @param node - The node for which to get the default pallet.
 * @returns The default pallet associated with the node.
 */
export const getDefaultPallet = (node: TNodeDotKsmWithRelayChains): TPallet => {
  return palletsMap[node].defaultPallet
}

/**
 * Retrieves the list of supported pallets for a specified node.
 *
 * @param node - The node for which to get supported pallets.
 * @returns An array of pallets supported by the node.
 */
export const getSupportedPallets = (node: TNodePolkadotKusama): TPallet[] => {
  return palletsMap[node].supportedPallets
}
