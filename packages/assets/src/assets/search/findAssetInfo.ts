import type { TChain } from '@paraspell/sdk-common'

import { isOverrideLocationSpecifier } from '../../guards'
import type { TAssetInfo, TCurrencyInput, TForeignAssetInfo } from '../../types'
import { getAssetsObject, getOtherAssets } from '../assets'
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

  const { otherAssets, nativeAssets } = getAssetsObject(chain)

  let asset: TAssetInfo | undefined
  if ('symbol' in currency) {
    asset = findAssetInfoBySymbol(destination, otherAssets, nativeAssets, currency.symbol)
  } else if ('location' in currency && !isOverrideLocationSpecifier(currency.location)) {
    asset =
      findAssetInfoByLoc(otherAssets, currency.location) ??
      findAssetInfoByLoc(nativeAssets as TForeignAssetInfo[], currency.location)

    // Temporary condition for Mythos to allow selecting by Etheruem MYTH location
    // Will be removed in v12
    if (chain === 'Mythos') {
      const mythEthAsset = getOtherAssets('Ethereum').find(a => a.symbol === 'MYTH')
      if (mythEthAsset && findAssetInfoByLoc([mythEthAsset], currency.location))
        asset = nativeAssets[0]
    }
  } else if ('id' in currency) {
    asset = findAssetInfoById(otherAssets, currency.id)
  }

  return asset ?? null
}
