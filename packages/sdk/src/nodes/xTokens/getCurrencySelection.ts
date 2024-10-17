import type { TXTokensCurrencySelection, XTokensTransferInput } from '../../types'
import { getNode } from '../../utils'
import { getModifiedCurrencySelection } from './getModifiedCurrencySelection'

export const getCurrencySelection = <TApi, TRes>(
  input: XTokensTransferInput<TApi, TRes>,
  isAssetHub: boolean,
  currencySelection: TXTokensCurrencySelection
): TXTokensCurrencySelection => {
  const { origin, overridedCurrencyMultiLocation } = input

  const { version } = getNode(origin)

  if (overridedCurrencyMultiLocation !== undefined)
    return { [version]: overridedCurrencyMultiLocation }

  if (isAssetHub) {
    return getModifiedCurrencySelection(version, input)
  }

  return currencySelection
}
