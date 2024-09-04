import type { TXTokensCurrencySelection, TMultiLocationHeader, TCurrency } from '../../types'

export const getParameters = (
  isAssetHub: boolean,
  currencySelection: TXTokensCurrencySelection,
  addressSelection: TMultiLocationHeader,
  amount: string,
  fees: string | number,
  feeAsset?: TCurrency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] => {
  if (isAssetHub) {
    return feeAsset !== undefined
      ? [currencySelection, feeAsset, addressSelection, fees]
      : [currencySelection, addressSelection, fees]
  }
  return [currencySelection, amount, addressSelection, fees]
}
