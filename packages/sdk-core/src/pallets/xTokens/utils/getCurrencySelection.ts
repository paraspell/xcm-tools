import type { TXTokensCurrencySelection, TXTokensTransferOptions } from '../../../types'
import { getNode } from '../../../utils'
import { getModifiedCurrencySelection } from './getModifiedCurrencySelection'

export const getCurrencySelection = <TApi, TRes>(
  input: TXTokensTransferOptions<TApi, TRes>,
  useMultiAssets: boolean,
  currencySelection: TXTokensCurrencySelection
): TXTokensCurrencySelection => {
  const { origin } = input

  const { version } = getNode(origin)

  if (useMultiAssets) {
    return getModifiedCurrencySelection(version, input)
  }

  return currencySelection
}
