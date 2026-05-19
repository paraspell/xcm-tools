// Contains different useful asset query operations from compatible Parachains asset map

import type { TChain } from '@paraspell/sdk-common'
import { isCustomChain } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../errors'
import assetsMapJson from '../maps/assets.json' with { type: 'json' }
import type { TAssetInfo, TCustomCtx } from '../types'
import { type TAssetJsonMap, type TChainAssetsInfo } from '../types'
import { mergeCustomAssets } from './customAssets'
import { isSymbolMatch } from './isSymbolMatch'
import { findNativeAssetInfoOrThrowImpl } from './search'

const assetsMap = assetsMapJson as TAssetJsonMap

export const getAssetsObjectImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): TChainAssetsInfo => {
  if (isCustomChain<TCustomChain>(chain)) {
    const entry = ctx?.customChainAssets?.[chain]
    if (!entry) {
      throw new InvalidCurrencyError(`Custom chain '${chain}' is not registered.`)
    }
    return entry
  }
  const base = assetsMap[chain]
  const overlay = ctx?.customAssets?.[chain]
  if (!overlay || overlay.length === 0) return base
  return { ...base, assets: mergeCustomAssets(base.assets, overlay) }
}

/**
 * Retrieves the assets object for a given chain containing the native and foreign assets.
 *
 * @param chain - The chain for which to retrieve the assets object.
 * @returns The assets object associated with the given chain.
 */
export const getAssetsObject = (chain: TChain): TChainAssetsInfo => getAssetsObjectImpl(chain)

export const isChainEvmImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): boolean => getAssetsObjectImpl<TCustomChain>(chain, ctx).isEVM

export const isChainEvm = (chain: TChain): boolean => isChainEvmImpl(chain)

/**
 * Retrieves the asset ID for a given symbol on a specified chain.
 *
 * @deprecated Use `findAssetInfo` instead. Will be removed in v14.
 *
 * @param chain - The chain to search for the asset.
 * @param symbol - The symbol of the asset.
 * @returns The asset ID if found; otherwise, null.
 */
export const getAssetId = (chain: TChain, symbol: string): string | null => {
  const asset = getAssetsObject(chain).assets.find(o => o.symbol === symbol)
  return asset != null && asset.assetId ? asset.assetId : null
}

export const getRelayChainSymbolImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): string => getAssetsObjectImpl<TCustomChain>(chain, ctx).relaychainSymbol

/**
 * Retrieves the relay chain asset symbol for a specified chain.
 *
 * @param chain - The chain for which to get the relay chain symbol.
 * @returns The relay chain asset symbol.
 */
export const getRelayChainSymbol = (chain: TChain): string => getRelayChainSymbolImpl(chain)

export const getNativeAssetsImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): TAssetInfo[] =>
  getAssetsObjectImpl<TCustomChain>(chain, ctx).assets.filter(asset => asset.isNative)

/**
 * Retrieves the list of native assets for a specified chain.
 *
 * @param chain - The chain for which to get native assets.
 * @returns An array of native asset details.
 */
export const getNativeAssets = (chain: TChain): TAssetInfo[] => getNativeAssetsImpl(chain)

export const getOtherAssetsImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): TAssetInfo[] =>
  getAssetsObjectImpl<TCustomChain>(chain, ctx).assets.filter(asset => !asset.isNative)

/**
 * Retrieves the list of other (non-native) assets for a specified chain.
 *
 * @param chain - The chain for which to get other assets.
 * @returns An array of other asset details.
 */
export const getOtherAssets = (chain: TChain): TAssetInfo[] => getOtherAssetsImpl(chain)

export const getAssetsImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): TAssetInfo[] => getAssetsObjectImpl<TCustomChain>(chain, ctx).assets

/**
 * Retrieves the complete list of assets for a specified chain, including relay chain asset, native, and other assets.
 *
 * @param chain - The chain for which to get the assets.
 * @returns An array of objects of all assets associated with the chain.
 */
export const getAssets = (chain: TChain): TAssetInfo[] => getAssetsImpl(chain)

/**
 * Retrieves the symbols of all assets (relay chain, native, and other assets) for a specified chain.
 *
 * @param chain - The chain for which to get asset symbols.
 * @returns An array of asset symbols.
 */
export const getAllAssetsSymbols = (chain: TChain): string[] => {
  const { assets } = getAssetsObject(chain)
  return assets.map(({ symbol }) => symbol)
}

export const getNativeAssetSymbolImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): string => getAssetsObjectImpl<TCustomChain>(chain, ctx).nativeAssetSymbol

/**
 * Retrieves the symbol of the native asset for a specified chain.
 *
 * @param chain - The chain for which to get the native asset symbol.
 * @returns The symbol of the native asset.
 */
export const getNativeAssetSymbol = (chain: TChain): string => getNativeAssetSymbolImpl(chain)

/**
 * Determines whether a specified chain supports an asset with the given symbol.
 *
 * @deprecated Use `findAssetInfo` instead. Will be removed in v14.
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
 * @deprecated Use `findAssetInfo` instead. Will be removed in v14.
 *
 * @param chain - The chain where the asset is located.
 * @param symbol - The symbol of the asset.
 * @returns The number of decimals if the asset is found; otherwise, null.
 */
export const getAssetDecimals = (chain: TChain, symbol: string): number | null => {
  const { assets } = getAssetsObject(chain)
  const isMainNativeAsset = isSymbolMatch(symbol, getNativeAssetSymbol(chain))
  if (isMainNativeAsset) return findNativeAssetInfoOrThrowImpl(chain).decimals
  const asset = assets.find(o => o.symbol === symbol)
  return asset?.decimals !== undefined ? asset.decimals : null
}

export const hasDryRunSupportImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): boolean => {
  // These chains have DryRun but it's not working
  const DISABLED_CHAINS: TChain[] = ['Basilisk', 'Jamton']
  return (
    getAssetsObjectImpl<TCustomChain>(chain, ctx).supportsDryRunApi &&
    !DISABLED_CHAINS.some(disabled => disabled === chain)
  )
}

export const hasDryRunSupport = (chain: TChain): boolean => hasDryRunSupportImpl(chain)

export const hasXcmPaymentApiSupportImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): boolean => {
  // These chains have XcmPaymentApi but it's not working
  const DISABLED_CHAINS: TChain[] = ['Basilisk', 'Jamton']
  return (
    getAssetsObjectImpl<TCustomChain>(chain, ctx).supportsXcmPaymentApi &&
    !DISABLED_CHAINS.some(disabled => disabled === chain)
  )
}

export const hasXcmPaymentApiSupport = (chain: TChain): boolean =>
  hasXcmPaymentApiSupportImpl(chain)

export * from './getExistentialDeposit'
export * from './getFeeAssets'
