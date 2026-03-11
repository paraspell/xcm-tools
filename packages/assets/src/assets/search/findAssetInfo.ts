import type { TChain } from '@paraspell/sdk-common'

import { isOverrideLocationSpecifier } from '../../guards'
import type { TAssetInfo, TCurrencyInput } from '../../types'
import { getNativeAssets, getOtherAssets } from '../assets'
import { findAssetInfoById } from './findAssetInfoById'
import { findAssetInfoByLoc } from './findAssetInfoByLoc'
import { findAssetInfoBySymbol } from './findAssetInfoBySymbol'

export const findAssetInfo = (
  chain: TChain,
  currency: TCurrencyInput,
  destination: TChain | null
): TAssetInfo | null => {
  if (
    ('location' in currency && isOverrideLocationSpecifier(currency.location)) ||
    Array.isArray(currency)
  ) {
    return null
  }

  const otherAssets = getOtherAssets(chain)
  const nativeAssets = getNativeAssets(chain)

  const assets = [...nativeAssets, ...otherAssets]

  let asset: TAssetInfo | undefined
  if ('symbol' in currency) {
    asset = findAssetInfoBySymbol(destination, otherAssets, nativeAssets, currency.symbol)
  } else if ('location' in currency && !isOverrideLocationSpecifier(currency.location)) {
    asset = findAssetInfoByLoc(assets, currency.location)
  } else if ('id' in currency) {
    asset = findAssetInfoById(assets, currency.id)
  }

  return asset ?? null
}
