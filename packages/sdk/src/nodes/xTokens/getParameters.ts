import type { TXTokensCurrencySelection, TMultiLocationHeader, TCurrency } from '../../types'

export const getParameters = (
  isAssetHub: boolean,
  currencySelection: TXTokensCurrencySelection,
  addressSelection: TMultiLocationHeader,
  amount: string,
  fees: string | number,
  feeAsset?: TCurrency
): unknown[] => {
  if (isAssetHub) {
    return feeAsset !== undefined
      ? [currencySelection, feeAsset, addressSelection, fees]
      : [currencySelection, addressSelection, fees]
  }
  return [currencySelection, amount, addressSelection, fees]
}
