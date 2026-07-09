// Contains different useful asset query operations from compatible Parachains asset map

import type { TChain } from '@paraspell/sdk-common'
import { isCustomChain } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../errors'
import assetsMapJson from '../maps/assets.json' with { type: 'json' }
import type { TAssetInfo, TCustomCtx } from '../types'
import { type TAssetJsonMap, type TChainAssetsInfo } from '../types'
import { mergeCustomAssets } from './customAssets'

const assetsMap = assetsMapJson as TAssetJsonMap

export const getAssetsObjectImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): TChainAssetsInfo => {
  if (isCustomChain(chain)) {
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
): boolean => getAssetsObjectImpl(chain, ctx).isEVM

export const isChainEvm = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain
): boolean => isChainEvmImpl(chain)

export const getRelayChainSymbolImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): string => getAssetsObjectImpl(chain, ctx).relaychainSymbol

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
): TAssetInfo[] => getAssetsObjectImpl(chain, ctx).assets.filter(asset => asset.isNative)

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
): TAssetInfo[] => getAssetsObjectImpl(chain, ctx).assets.filter(asset => !asset.isNative)

/**
 * Retrieves the list of other (non-native) assets for a specified chain.
 *
 * @param chain - The chain for which to get other assets.
 * @returns An array of other asset details.
 */
export const getOtherAssets = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain
): TAssetInfo[] => getOtherAssetsImpl(chain)

export const getAssetsImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): TAssetInfo[] => getAssetsObjectImpl(chain, ctx).assets

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
): string => getAssetsObjectImpl(chain, ctx).nativeAssetSymbol

/**
 * Retrieves the symbol of the native asset for a specified chain.
 *
 * @param chain - The chain for which to get the native asset symbol.
 * @returns The symbol of the native asset.
 */
export const getNativeAssetSymbol = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain
): string => getNativeAssetSymbolImpl(chain)

export const hasDryRunSupportImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): boolean => {
  // These chains have DryRun but it's not working
  const DISABLED_CHAINS: TChain[] = ['Basilisk', 'Jamton']
  return (
    getAssetsObjectImpl(chain, ctx).supportsDryRunApi &&
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
    getAssetsObjectImpl(chain, ctx).supportsXcmPaymentApi &&
    !DISABLED_CHAINS.some(disabled => disabled === chain)
  )
}

export const hasXcmPaymentApiSupport = (chain: TChain): boolean =>
  hasXcmPaymentApiSupportImpl(chain)

export * from './getExistentialDeposit'
export * from './getFeeAssets'
