import type { TAmount, TMultiAssetWithFee } from '@paraspell/assets'
import { isTMultiLocation, type TMultiLocation } from '@paraspell/sdk-common'

import type { TXcmVersioned, TXTokensCurrencySelection } from '../../../types'

export const getXTokensParameters = (
  isMultiAssetTransfer: boolean,
  currencySelection: TXTokensCurrencySelection,
  addressSelection: TXcmVersioned<TMultiLocation>,
  amount: TAmount,
  fees: string | number,
  overriddenAsset?: TMultiLocation | TMultiAssetWithFee[]
): Record<string, unknown> => {
  if (!isMultiAssetTransfer) {
    return {
      currency_id: currencySelection,
      amount: BigInt(amount),
      dest: addressSelection,
      dest_weight_limit: fees
    }
  }

  const isOverriddenMultiAssets = overriddenAsset && !isTMultiLocation(overriddenAsset)
  const assetKey = isOverriddenMultiAssets ? 'assets' : 'asset'
  const feeAssetIndex = isOverriddenMultiAssets
    ? overriddenAsset.findIndex(asset => asset.isFeeAsset)
    : undefined

  const feeIndexWithFallback = feeAssetIndex === -1 ? 0 : feeAssetIndex

  return {
    [assetKey]: currencySelection,
    ...(isOverriddenMultiAssets && { fee_item: feeIndexWithFallback }),
    dest: addressSelection,
    dest_weight_limit: fees
  }
}
