// Contains basic structure of xToken call

import type {
  XTokensTransferInput,
  TXTokensCurrencySelection,
  TTransferReturn,
  XTokensSection,
  TSerializedApiCallV2
} from '../../types'
import { getCurrencySelection } from './getCurrencySelection'
import { getXTokensParameters } from './getXTokensParameters'

class XTokensTransferImpl {
  static transferXTokens<TApi, TRes>(
    input: XTokensTransferInput<TApi, TRes>,
    currencySelection: TXTokensCurrencySelection,
    fees: string | number = 'Unlimited'
  ): TTransferReturn<TRes> {
    const { api, amount, addressSelection, destination, feeAsset, serializedApiCallEnabled } = input

    const isMultiLocationDestination = typeof destination === 'object'
    if (isMultiLocationDestination) {
      throw new Error(
        'Multilocation destinations are not supported for specific transfer you are trying to create. In special cases such as xTokens or xTransfer pallet try using address multilocation instead (for both destination and address in same multilocation set (eg. X2 - Parachain, Address). For further assistance please open issue in our repository.'
      )
    }

    const isAssetHub = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'

    const modifiedCurrencySelection = getCurrencySelection(input, isAssetHub, currencySelection)

    const section: XTokensSection = isAssetHub
      ? feeAsset
        ? 'transfer_multiassets'
        : 'transfer_multiasset'
      : 'transfer'

    const parameters = getXTokensParameters(
      isAssetHub,
      modifiedCurrencySelection,
      addressSelection,
      amount,
      fees,
      feeAsset
    )

    const call: TSerializedApiCallV2 = {
      module: 'XTokens',
      section,
      parameters
    }

    if (serializedApiCallEnabled === true) {
      return {
        ...call,
        parameters: Object.values(parameters)
      }
    }

    return api.callTxMethod(call)
  }
}

export default XTokensTransferImpl
