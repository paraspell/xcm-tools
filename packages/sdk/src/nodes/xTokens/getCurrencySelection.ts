import { TXTokensCurrencySelection, XTokensTransferInput } from '../../types'
import { getNode } from '../../utils'
import { getModifiedCurrencySelection } from './getModifiedCurrencySelection'

export const getCurrencySelection = (
  { origin, amount, currencyID, paraIdTo, overridedCurrencyMultiLocation }: XTokensTransferInput,
  isAssetHub: boolean,
  currencySelection: TXTokensCurrencySelection
): TXTokensCurrencySelection => {
  const { version } = getNode(origin)

  if (overridedCurrencyMultiLocation !== undefined)
    return { [version]: overridedCurrencyMultiLocation }

  if (isAssetHub) {
    return getModifiedCurrencySelection(version, amount, currencyID, paraIdTo)
  }

  return currencySelection
}
