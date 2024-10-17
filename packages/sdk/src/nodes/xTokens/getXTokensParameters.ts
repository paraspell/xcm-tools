import type { TXTokensCurrencySelection, TMultiLocationHeader, TCurrency } from '../../types'

export const getXTokensParameters = (
  isDestAssetHub: boolean,
  currencySelection: TXTokensCurrencySelection,
  addressSelection: TMultiLocationHeader,
  amount: string,
  fees: string | number,
  feeAsset?: TCurrency
): Record<string, unknown> => {
  if (isDestAssetHub) {
    return {
      [feeAsset !== undefined ? 'assets' : 'asset']: currencySelection,
      ...(feeAsset !== undefined && { fee_item: feeAsset }),
      dest: addressSelection,
      dest_weight_limit: fees
    }
  }

  return { currency_id: currencySelection, amount, dest: addressSelection, dest_weight_limit: fees }
}
