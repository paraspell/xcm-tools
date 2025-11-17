import type { TAmount, TAssetWithFee } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'
import { isTLocation, type TLocation } from '@paraspell/sdk-common'

import type { TXTokensCurrencySelection } from '../../../types'
import { addXcmVersionHeader } from '../../../utils'

export const getXTokensParams = (
  isMultiAssetTransfer: boolean,
  currencySelection: TXTokensCurrencySelection,
  destLocation: TLocation,
  amount: TAmount,
  weightLimit: string | number,
  version: Version,
  overriddenAsset?: TLocation | TAssetWithFee[]
): Record<string, unknown> => {
  const versionedDestLocation = addXcmVersionHeader(destLocation, version)

  if (!isMultiAssetTransfer) {
    return {
      currency_id: currencySelection,
      amount: BigInt(amount),
      dest: versionedDestLocation,
      dest_weight_limit: weightLimit
    }
  }

  const isOverriddenMultiAssets = overriddenAsset && !isTLocation(overriddenAsset)
  const assetKey = isOverriddenMultiAssets ? 'assets' : 'asset'
  const feeAssetIndex = isOverriddenMultiAssets
    ? overriddenAsset.findIndex(asset => asset.isFeeAsset)
    : undefined

  const feeIndexWithFallback = feeAssetIndex === -1 ? 0 : feeAssetIndex

  return {
    [assetKey]: currencySelection,
    ...(isOverriddenMultiAssets && { fee_item: feeIndexWithFallback }),
    dest: versionedDestLocation,
    dest_weight_limit: weightLimit
  }
}
