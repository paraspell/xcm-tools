// Script that pulls XCM Pallets for selected Parachain

import type { TSubstrateChain } from '@paraspell/sdk-common'

import { XcmPalletNotFoundError } from '../errors'
import * as palletsMapJson from '../maps/pallets.json' with { type: 'json' }
import type { TAssetsPallet, TPalletDetails } from '../types'
import { type TPallet, type TPalletJsonMap } from '../types'

const palletsMap = palletsMapJson as TPalletJsonMap

/**
 * Retrieves the default pallet for a specified chain.
 *
 * @param chain - The chain for which to get the default pallet.
 * @returns The default pallet associated with the chain.
 */
export const getDefaultPallet = (chain: TSubstrateChain): TPallet => palletsMap[chain].defaultPallet

/**
 * Retrieves the list of supported pallets for a specified chain.
 *
 * @param chain - The chain for which to get supported pallets.
 * @returns An array of pallets supported by the chain.
 */
export const getSupportedPallets = (chain: TSubstrateChain): TPallet[] =>
  palletsMap[chain].supportedPallets.map(pallet => pallet.name)

export const getSupportedPalletsDetails = (chain: TSubstrateChain): TPalletDetails[] =>
  palletsMap[chain].supportedPallets

export const getPalletIndex = (chain: TSubstrateChain, pallet: TPallet): number | undefined =>
  palletsMap[chain].supportedPallets.find(p => p.name === pallet)?.index

export const getNativeAssetsPallet = (chain: TSubstrateChain): TAssetsPallet =>
  palletsMap[chain].nativeAssets

export const getOtherAssetsPallets = (chain: TSubstrateChain): TAssetsPallet[] =>
  palletsMap[chain].otherAssets

export const hasPallet = (chain: TSubstrateChain, pallet: TPallet): boolean =>
  palletsMap[chain].supportedPallets.some(p => p.name === pallet)

/**
 * Retrieves the XCM pallet for a specified chain.
 *
 * @param chain - The chain for which to get the XCM pallet.
 * @returns The XCM pallet found on the chain (XcmPallet or PolkadotXcm).
 * @throws {@link XcmPalletNotFoundError} If no XCM pallet is found on the chain.
 */
export const getXcmPallet = (chain: TSubstrateChain): TPallet => {
  const candidates: TPallet[] = ['XcmPallet', 'PolkadotXcm']
  for (const pallet of candidates) {
    if (hasPallet(chain, pallet)) return pallet
  }
  throw new XcmPalletNotFoundError(chain)
}
