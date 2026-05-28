import type { TChain } from '@paraspell/sdk-common'

import { isOverrideLocationSpecifier } from '../../guards'
import type { TAssetInfo, TCurrencyInput, TCustomCtx } from '../../types'
import { getNativeAssetsImpl, getOtherAssetsImpl } from '../assets'
import { findAssetInfoById } from './findAssetInfoById'
import { findAssetInfoByLoc } from './findAssetInfoByLoc'
import { findAssetInfoBySymbol } from './findAssetInfoBySymbol'

export const findAssetInfoImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  currency: TCurrencyInput,
  destination?: TChain | TCustomChain | null,
  ctx?: TCustomCtx
): TAssetInfo | null => {
  if (
    ('location' in currency && isOverrideLocationSpecifier(currency.location)) ||
    Array.isArray(currency)
  ) {
    return null
  }

  const otherAssets = getOtherAssetsImpl(chain, ctx)
  const nativeAssets = getNativeAssetsImpl(chain, ctx)

  const assets = [...nativeAssets, ...otherAssets]

  let asset: TAssetInfo | undefined
  if ('symbol' in currency) {
    asset = findAssetInfoBySymbol(
      otherAssets,
      nativeAssets,
      currency.symbol,
      destination ?? undefined
    )
  } else if ('location' in currency && !isOverrideLocationSpecifier(currency.location)) {
    asset = findAssetInfoByLoc(assets, currency.location)
  } else if ('id' in currency) {
    asset = findAssetInfoById(assets, currency.id)
  }

  return asset ?? null
}

export const findAssetInfo = (
  chain: TChain,
  currency: TCurrencyInput,
  destination?: TChain | null
): TAssetInfo | null => findAssetInfoImpl(chain, currency, destination)
