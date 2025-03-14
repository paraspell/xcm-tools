// Script that pulls XCM Pallets for selected Parachain

import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import * as palletsMapJson from '../maps/pallets.json' with { type: 'json' }
import type { TPalletDetails } from '../types'
import { type TPallet, type TPalletJsonMap } from '../types'

const palletsMap = palletsMapJson as TPalletJsonMap

/**
 * Retrieves the default pallet for a specified node.
 *
 * @param node - The node for which to get the default pallet.
 * @returns The default pallet associated with the node.
 */
export const getDefaultPallet = (node: TNodeDotKsmWithRelayChains): TPallet =>
  palletsMap[node].defaultPallet

/**
 * Retrieves the list of supported pallets for a specified node.
 *
 * @param node - The node for which to get supported pallets.
 * @returns An array of pallets supported by the node.
 */
export const getSupportedPallets = (node: TNodeDotKsmWithRelayChains): TPallet[] =>
  palletsMap[node].supportedPallets.map(pallet => pallet.name)

export const getSupportedPalletsDetails = (node: TNodeDotKsmWithRelayChains): TPalletDetails[] =>
  palletsMap[node].supportedPallets
