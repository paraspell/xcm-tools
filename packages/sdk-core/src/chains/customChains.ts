import { canonicalizeLocation, type TAssetInfo, type TChainAssetsInfo } from '@paraspell/assets'
import type { TAssetsPallet, TCustomChainPallets, TPalletEntry } from '@paraspell/pallets'
import {
  ASSETS_PALLETS,
  NATIVE_ASSETS_PALLET_PRIORITY,
  OTHER_ASSETS_PALLET_PRIORITY
} from '@paraspell/pallets'
import type { TLocation } from '@paraspell/sdk-common'
import { CHAINS, deepEqual, DEFAULT_SS58_PREFIX } from '@paraspell/sdk-common'

import { CustomChainConflictError, CustomChainInvalidError } from '../errors'
import type {
  TChainConfig,
  TCustomChainEntry,
  TCustomChainEntryHydrated,
  TCustomChainInput,
  TCustomChainPalletsInput,
  TCustomChainsCtx,
  TCustomChainsMap
} from '../types'
import { getRelayChainSymbolOf } from '../utils'

const buildNativeLocation = (paraId: number): TLocation => ({
  parents: 1,
  interior: { X1: [{ Parachain: paraId }] }
})

const assertKnownAssetsPallet = (name: string, pallet: string): void => {
  if (!ASSETS_PALLETS.includes(pallet as TAssetsPallet)) {
    throw new CustomChainInvalidError(
      `Custom chain '${name}' references unknown assets pallet '${pallet}'. ` +
        `Valid values: ${ASSETS_PALLETS.join(', ')}.`
    )
  }
}

const validatePalletsInput = (
  name: string,
  pallets: TCustomChainPalletsInput | undefined
): void => {
  if (!pallets) return
  if (pallets.nativeAssets !== undefined) {
    assertKnownAssetsPallet(name, pallets.nativeAssets)
  }
  for (const p of pallets.otherAssets ?? []) {
    assertKnownAssetsPallet(name, p)
  }
}

const normalizePalletsInput = (
  pallets: TCustomChainPalletsInput | undefined
): TCustomChainPallets | undefined => {
  if (!pallets || (pallets.nativeAssets === undefined && pallets.otherAssets === undefined)) {
    return undefined
  }
  return {
    nativeAssets: pallets.nativeAssets as TAssetsPallet,
    otherAssets: pallets.otherAssets ? [...pallets.otherAssets] : []
  }
}

const validate = (name: string, input: TCustomChainInput): void => {
  if (CHAINS.some(chain => chain === name)) {
    throw new CustomChainConflictError(
      `Custom chain '${name}' collides with a built-in chain of the same name.`
    )
  }
  if (typeof input.paraId !== 'number' || !Number.isInteger(input.paraId) || input.paraId < 0) {
    throw new CustomChainInvalidError(
      `Custom chain '${name}' has invalid paraId: ${String(input.paraId)}.`
    )
  }
  if (!Array.isArray(input.providers) || input.providers.length === 0) {
    throw new CustomChainInvalidError(
      `Custom chain '${name}' must declare at least one provider endpoint.`
    )
  }
  validatePalletsInput(name, input.pallets)
  const seen: TLocation[] = []
  for (const asset of input.assets ?? []) {
    if (seen.some(loc => deepEqual(loc, asset.location))) {
      throw new CustomChainInvalidError(
        `Custom chain '${name}' has duplicate asset location for '${asset.symbol}'.`
      )
    }
    seen.push(asset.location)
  }
}

export const normalizeCustomChains = (map: TCustomChainsMap | undefined): TCustomChainsCtx => {
  if (!map) return {}
  const result: TCustomChainsCtx = {}
  for (const [name, input] of Object.entries(map)) {
    const assets = (input.assets ?? []).map(asset => ({
      ...asset,
      location: canonicalizeLocation(asset.location)
    }))
    validate(name, { ...input, assets })
    result[name] = {
      name,
      paraId: input.paraId,
      ecosystem: input.ecosystem,
      providers: input.providers,
      xcmVersion: input.xcmVersion,
      ss58Prefix: input.ss58Prefix,
      nativeAssetSymbol: input.nativeAssetSymbol,
      nativeAssetDecimals: input.nativeAssetDecimals,
      assets,
      pallets: normalizePalletsInput(input.pallets)
    }
  }
  return result
}

export const buildCustomChainConfig = (entry: TCustomChainEntry): TChainConfig => ({
  name: entry.name,
  info: entry.name,
  paraId: entry.paraId,
  providers: entry.providers
})

const requireNativeAssetFields = (
  entry: TCustomChainEntryHydrated
): { symbol: string; decimals: number } => {
  if (!entry.nativeAssetSymbol) {
    throw new CustomChainInvalidError(
      `Custom chain '${entry.name}' failed to automatically fetch nativeAssetSymbol. Please provide one.`
    )
  }
  if (entry.nativeAssetDecimals === undefined) {
    throw new CustomChainInvalidError(
      `Custom chain '${entry.name}' failed to automatically fetch nativeAssetDecimals. Please provide one.`
    )
  }
  return { symbol: entry.nativeAssetSymbol, decimals: entry.nativeAssetDecimals }
}

const buildAutoNativeAsset = (entry: TCustomChainEntryHydrated): TAssetInfo => {
  const { symbol, decimals } = requireNativeAssetFields(entry)
  return {
    symbol,
    decimals,
    location: buildNativeLocation(entry.paraId),
    isNative: true,
    ...(entry.nativeExistentialDeposit !== undefined && {
      existentialDeposit: entry.nativeExistentialDeposit
    })
  }
}

const resolveAssets = (entry: TCustomChainEntryHydrated): TAssetInfo[] => {
  const declaredNativeAsset = entry.assets.find(asset => asset.isNative)
  if (declaredNativeAsset) {
    if (declaredNativeAsset.existentialDeposit === undefined && entry.nativeExistentialDeposit) {
      return entry.assets.map(asset =>
        asset === declaredNativeAsset
          ? { ...asset, existentialDeposit: entry.nativeExistentialDeposit }
          : asset
      )
    }
    return entry.assets
  }
  return [buildAutoNativeAsset(entry), ...entry.assets]
}

export const buildCustomChainAssetsInfo = (entry: TCustomChainEntryHydrated): TChainAssetsInfo => ({
  relaychainSymbol: getRelayChainSymbolOf(entry.ecosystem),
  nativeAssetSymbol: requireNativeAssetFields(entry).symbol,
  isEVM: entry.isEVM,
  ss58Prefix: entry.ss58Prefix ?? DEFAULT_SS58_PREFIX,
  supportsDryRunApi: entry.supportsDryRunApi,
  supportsXcmPaymentApi: entry.supportsXcmPaymentApi,
  assets: resolveAssets(entry)
})

export const resolveCustomChainAssetPallets = (
  chainName: string,
  pallets: TPalletEntry[],
  override?: TCustomChainPallets
): TCustomChainPallets => {
  const withExtrinsics = new Set(pallets.filter(p => p.hasExtrinsics).map(p => p.name))
  const withoutExtrinsics = new Set(pallets.filter(p => !p.hasExtrinsics).map(p => p.name))

  const detectedNative = NATIVE_ASSETS_PALLET_PRIORITY.find(p => withExtrinsics.has(p)) as
    | TAssetsPallet
    | undefined

  const detectedOther: TAssetsPallet[] = [
    ...OTHER_ASSETS_PALLET_PRIORITY.filter(p => withExtrinsics.has(p)),
    ...OTHER_ASSETS_PALLET_PRIORITY.filter(p => withoutExtrinsics.has(p))
  ] as TAssetsPallet[]

  const nativeAssets = override?.nativeAssets ?? detectedNative
  if (!nativeAssets) {
    throw new CustomChainInvalidError(
      `Custom chain '${chainName}' has no native-assets pallet. ` +
        `Expected one of: ${NATIVE_ASSETS_PALLET_PRIORITY.join(', ')}. ` +
        `Provide pallets.nativeAssets explicitly.`
    )
  }

  const otherAssets =
    override?.otherAssets && override.otherAssets.length > 0 ? override.otherAssets : detectedOther

  return { nativeAssets, otherAssets, supportedPallets: pallets }
}
