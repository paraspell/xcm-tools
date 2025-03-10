import type {
  TAmount,
  TMultiAssetWithFee,
  TMultiLocation,
  TXcmVersioned,
  TXTokensCurrencySelection
} from '../../../types'
import { isTMultiLocation } from '../../xcmPallet/utils'

export const getXTokensParameters = (
  isMultiAssetTransfer: boolean,
  currencySelection: TXTokensCurrencySelection,
  addressSelection: TXcmVersioned<TMultiLocation>,
  amount: TAmount,
  fees: string | number,
  overriddenAsset?: TMultiLocation | TMultiAssetWithFee[]
): Record<string, unknown> => {
  if (isMultiAssetTransfer) {
    const isOverridenMultiAssets = overriddenAsset && !isTMultiLocation(overriddenAsset)

    const feeAssetIndex = isOverridenMultiAssets
      ? overriddenAsset.findIndex(asset => asset.isFeeAsset)
      : undefined

    return {
      [isOverridenMultiAssets ? 'assets' : 'asset']: currencySelection,
      ...(isOverridenMultiAssets && { fee_item: feeAssetIndex }),
      dest: addressSelection,
      dest_weight_limit: fees
    }
  }

  return {
    currency_id: currencySelection,
    amount: BigInt(amount),
    dest: addressSelection,
    dest_weight_limit: fees
  }
}
