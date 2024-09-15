// Contains basic structure of xToken call

import type {
  XTokensTransferInput,
  TXTokensCurrencySelection,
  TTransferReturn,
  XTokensSection,
  XTokensModule
} from '../../types'
import { getCurrencySelection } from './getCurrencySelection'
import { getParameters } from './getParameters'

class XTokensTransferImpl {
  static transferXTokens(
    input: XTokensTransferInput,
    currencySelection: TXTokensCurrencySelection,
    fees: string | number = 'Unlimited'
  ): TTransferReturn {
    const { api, amount, addressSelection, destination, feeAsset, serializedApiCallEnabled } = input

    const isMultiLocationDestination = typeof destination === 'object'
    if (isMultiLocationDestination) {
      throw new Error(
        'Multilocation destinations are not supported for specific transfer you are trying to create. In special cases such as xTokens or xTransfer pallet try using address multilocation instead (for both destination and address in same multilocation set (eg. X2 - Parachain, Address). For further assistance please open issue in our repository.'
      )
    }

    const isAssetHub = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'

    const modifiedCurrencySelection = getCurrencySelection(input, isAssetHub, currencySelection)

    const module: XTokensModule = 'xTokens'
    const section: XTokensSection = isAssetHub ? 'transferMultiasset' : 'transfer'

    const parameters = getParameters(
      isAssetHub,
      modifiedCurrencySelection,
      addressSelection,
      amount,
      fees,
      feeAsset
    )

    if (serializedApiCallEnabled === true) {
      return {
        module,
        section,
        parameters
      }
    }

    return api.tx[module][section](...parameters)
  }
}

export default XTokensTransferImpl
