import { isTMultiLocation } from '../../xcmPallet/utils'
import type {
  TXTokensCurrencySelection,
  TAmount,
  TMultiAssetWithFee,
  TMultiLocation,
  TXcmVersioned
} from '../../../types'

export const getXTokensParameters = (
  isMultiAssetTransfer: boolean,
  currencySelection: TXTokensCurrencySelection,
  addressSelection: TXcmVersioned<TMultiLocation>,
  amount: TAmount,
  fees: string | number,
  overriddenAsset?: TMultiLocation | TMultiAssetWithFee[]
): Record<string, unknown> => {
  if (isMultiAssetTransfer) {
    const isMultiAsset = overriddenAsset && !isTMultiLocation(overriddenAsset)
    const feeAssetIndex = isMultiAsset
      ? overriddenAsset.findIndex(asset => asset.isFeeAsset)
      : undefined

    return {
      [isMultiAsset ? 'assets' : 'asset']: currencySelection,
      ...(isMultiAsset && { fee_item: feeAssetIndex }),
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
