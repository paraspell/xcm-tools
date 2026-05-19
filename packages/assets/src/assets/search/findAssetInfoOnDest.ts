import { isSnowbridge, isSubstrateBridge, replaceBigInt, type TChain } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput, TCustomCtx } from '../../types'
import { Foreign, Native } from '../assetSelectors'
import { isStableCoinAsset } from '../isStableCoinAsset'
import { isSystemAsset } from '../isSystemAsset'
import { findAssetInfoImpl } from './findAssetInfo'
import { findAssetInfoOrThrowImpl } from './findAssetInfoOrThrow'
import { findStablecoinAssets } from './findStablecoinAssets'

const findAssetInfoOnSubBridgeDest = (
  destination: TChain,
  resolvedOriginAsset: TAssetInfo,
  ctx?: TCustomCtx
): TAssetInfo | null => {
  const nativeMatch = findAssetInfoImpl(
    destination,
    { symbol: Native(resolvedOriginAsset.symbol) },
    null,
    ctx
  )
  if (nativeMatch) return nativeMatch

  const isStablecoin = isStableCoinAsset(resolvedOriginAsset)

  if (isStablecoin) {
    const stablecoins = findStablecoinAssets(destination)
    const match = stablecoins.find(asset => asset.symbol === resolvedOriginAsset.symbol)
    if (match) return match
  }

  const foreignMatch = findAssetInfoImpl(
    destination,
    { symbol: Foreign(resolvedOriginAsset.symbol) },
    null,
    ctx
  )
  if (foreignMatch) return foreignMatch

  return null
}

export const findAssetInfoOnDestImpl = (
  origin: TChain,
  destination: TChain,
  currency: TCurrencyInput,
  originAsset?: TAssetInfo | null,
  ctx?: TCustomCtx
): TAssetInfo | null => {
  const isSubBridge = isSubstrateBridge(origin, destination)
  const isSb = isSnowbridge(origin, destination)

  const resolvedOriginAsset =
    originAsset ?? findAssetInfoOrThrowImpl(origin, currency, destination, ctx)

  if (isSubBridge) {
    return findAssetInfoOnSubBridgeDest(destination, resolvedOriginAsset, ctx)
  }

  if (isSb && isSystemAsset(resolvedOriginAsset)) {
    const match = findAssetInfoImpl(destination, { symbol: resolvedOriginAsset.symbol }, null, ctx)
    if (match) return match
  }

  // MYTH has two valid locations (native on Mythos, ERC-20 on Ethereum),
  // so resolve by symbol for the Mythos -> Ethereum Snowbridge transfer.
  if (isSb && origin === 'Mythos' && resolvedOriginAsset.symbol === 'MYTH') {
    const match = findAssetInfoImpl(destination, { symbol: 'MYTH' }, null, ctx)
    if (match) return match
  }

  return findAssetInfoImpl(destination, { location: resolvedOriginAsset.location }, null, ctx)
}

export const findAssetInfoOnDest = (
  origin: TChain,
  destination: TChain,
  currency: TCurrencyInput,
  originAsset?: TAssetInfo | null
): TAssetInfo | null => findAssetInfoOnDestImpl(origin, destination, currency, originAsset)

export const findAssetOnDestOrThrowImpl = (
  origin: TChain,
  destination: TChain,
  currency: TCurrencyInput,
  ctx?: TCustomCtx
): TAssetInfo => {
  const asset = findAssetInfoOnDestImpl(origin, destination, currency, null, ctx)

  if (!asset) {
    throw new InvalidCurrencyError(
      `Asset ${JSON.stringify(currency, replaceBigInt)} not found on ${destination}`
    )
  }

  return asset
}

export const findAssetOnDestOrThrow = (
  origin: TChain,
  destination: TChain,
  currency: TCurrencyInput
): TAssetInfo => findAssetOnDestOrThrowImpl(origin, destination, currency)
