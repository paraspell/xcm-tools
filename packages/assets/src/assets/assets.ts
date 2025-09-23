// Contains different useful asset query operations from compatible Parachains asset map

import type { TChain } from '@paraspell/sdk-common'

import assetsMapJson from '../maps/assets.json' with { type: 'json' }
import type { TAssetInfo, TForeignAssetInfo } from '../types'
import { type TAssetJsonMap, type TChainAssetsInfo, type TNativeAssetInfo } from '../types'

const assetsMap = assetsMapJson as TAssetJsonMap

/**
 * Retrieves the assets object for a given chain containing the native and foreign assets.
 *
 * @param chain - The chain for which to retrieve the assets object.
 * @returns The assets object associated with the given chain.
 */
export const getAssetsObject = (chain: TChain): TChainAssetsInfo => assetsMap[chain]

export const isChainEvm = (chain: TChain): boolean => {
  return assetsMap[chain].isEVM
}

/**
 * Retrieves the asset ID for a given symbol on a specified chain.
 *
 * @param chain - The chain to search for the asset.
 * @param symbol - The symbol of the asset.
 * @returns The asset ID if found; otherwise, null.
 */
export const getAssetId = (chain: TChain, symbol: string): string | null => {
  const asset = getAssetsObject(chain).otherAssets.find(o => o.symbol === symbol)
  return asset != null && asset.assetId ? asset.assetId : null
}

/**
 * Retrieves the relay chain asset symbol for a specified chain.
 *
 * @param chain - The chain for which to get the relay chain symbol.
 * @returns The relay chain asset symbol.
 */
export const getRelayChainSymbol = (chain: TChain): string =>
  getAssetsObject(chain).relaychainSymbol

/**
 * Retrieves the list of native assets for a specified chain.
 *
 * @param chain - The chain for which to get native assets.
 * @returns An array of native asset details.
 */
export const getNativeAssets = (chain: TChain): TNativeAssetInfo[] =>
  getAssetsObject(chain).nativeAssets

/**
 * Retrieves the list of other (non-native) assets for a specified chain.
 *
 * @param chain - The chain for which to get other assets.
 * @returns An array of other asset details.
 */
export const getOtherAssets = (chain: TChain): TForeignAssetInfo[] => {
  const otherAssets = getAssetsObject(chain).otherAssets
  return chain === 'AssetHubPolkadot'
    ? [...otherAssets, ...getAssetsObject('Ethereum').otherAssets]
    : otherAssets
}

/**
 * Retrieves the complete list of assets for a specified chain, including relay chain asset, native, and other assets.
 *
 * @param chain - The chain for which to get the assets.
 * @returns An array of objects of all assets associated with the chain.
 */
export const getAssets = (chain: TChain): TAssetInfo[] => {
  const { nativeAssets, otherAssets } = getAssetsObject(chain)
  return [...nativeAssets, ...otherAssets]
}

/**
 * Retrieves the symbols of all assets (relay chain, native, and other assets) for a specified chain.
 *
 * @param chain - The chain for which to get asset symbols.
 * @returns An array of asset symbols.
 */
export const getAllAssetsSymbols = (chain: TChain): string[] => {
  const { nativeAssets, otherAssets } = getAssetsObject(chain)
  const nativeAssetsSymbols = nativeAssets.map(({ symbol }) => symbol)
  const otherAssetsSymbols = otherAssets.map(({ symbol }) => symbol)

  const ethAssetsSymbols =
    chain === 'AssetHubPolkadot'
      ? getAssetsObject('Ethereum').otherAssets.map(({ symbol }) => symbol)
      : []

  return [...nativeAssetsSymbols, ...otherAssetsSymbols, ...ethAssetsSymbols]
}

/**
 * Retrieves the symbol of the native asset for a specified chain.
 *
 * @param chain - The chain for which to get the native asset symbol.
 * @returns The symbol of the native asset.
 */
export const getNativeAssetSymbol = (chain: TChain): string => {
  if (chain === 'Ethereum') return 'ETH'
  return getAssetsObject(chain).nativeAssetSymbol
}

/**
 * Determines whether a specified chain supports an asset with the given symbol.
 *
 * @param chain - The chain to check for asset support.
 * @param symbol - The symbol of the asset to check.
 * @returns True if the asset is supported; otherwise, false.
 */
export const hasSupportForAsset = (chain: TChain, symbol: string): boolean => {
  const lowerSymbol = symbol.toLowerCase()
  const symbolsToCheck = new Set<string>()

  symbolsToCheck.add(lowerSymbol)

  if (lowerSymbol.startsWith('xc')) {
    symbolsToCheck.add(lowerSymbol.substring(2))
  } else {
    symbolsToCheck.add(`xc${lowerSymbol}`)
  }

  if (lowerSymbol.endsWith('.e')) {
    symbolsToCheck.add(lowerSymbol.substring(0, lowerSymbol.length - 2))
  } else {
    symbolsToCheck.add(`${lowerSymbol}.e`)
  }

  const chainSymbols = getAllAssetsSymbols(chain).map(s => s.toLowerCase())

  return chainSymbols.some(chainSymbol => symbolsToCheck.has(chainSymbol))
}
/**
 * Retrieves the number of decimals for an asset with the given symbol on a specified chain.
 *
 * @param chain - The chain where the asset is located.
 * @param symbol - The symbol of the asset.
 * @returns The number of decimals if the asset is found; otherwise, null.
 */
export const getAssetDecimals = (chain: TChain, symbol: string): number | null => {
  const { otherAssets, nativeAssets } = getAssetsObject(chain)
  const asset = [...otherAssets, ...nativeAssets].find(o => o.symbol === symbol)
  return asset?.decimals !== undefined ? asset.decimals : null
}

export const hasDryRunSupport = (chain: TChain): boolean => {
  // These chains have DryRun but it's not working
  const DISABLED_CHAINS: TChain[] = ['Basilisk', 'Jamton']
  return getAssetsObject(chain).supportsDryRunApi && !DISABLED_CHAINS.includes(chain)
}

export const hasXcmPaymentApiSupport = (chain: TChain): boolean => {
  // These chains have XcmPaymentApi but it's not working
  const DISABLED_CHAINS: TChain[] = ['IntegriteePaseo', 'Basilisk', 'Jamton']
  return getAssetsObject(chain).supportsXcmPaymentApi && !DISABLED_CHAINS.includes(chain)
}

export * from './getExistentialDeposit'
export * from './getFeeAssets'
