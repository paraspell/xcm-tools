// Contains basic structure of xToken call

import type {
  TXTokensTransferOptions,
  TXTokensCurrencySelection,
  TXTokensSection,
  TSerializedApiCall
} from '../../types'
import { getCurrencySelection } from './getCurrencySelection'
import { getXTokensParameters } from './getXTokensParameters'

class XTokensTransferImpl {
  static transferXTokens<TApi, TRes>(
    input: TXTokensTransferOptions<TApi, TRes>,
    currencySelection: TXTokensCurrencySelection,
    fees: string | number = 'Unlimited'
  ): TRes {
    const { api, origin, amount, addressSelection, destination, scenario, feeAsset } = input

    const isMultiLocationDestination = typeof destination === 'object'
    if (isMultiLocationDestination) {
      throw new Error(
        'Multilocation destinations are not supported for specific transfer you are trying to create. In special cases such as xTokens or xTransfer pallet try using address multilocation instead (for both destination and address in same multilocation set (eg. X2 - Parachain, Address). For further assistance please open issue in our repository.'
      )
    }

    const isBifrostOrigin = origin === 'BifrostPolkadot' || origin === 'BifrostKusama'
    const isAssetHubDest = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'

    const isAstarOrShidenToRelay =
      scenario === 'ParaToRelay' && (origin === 'Astar' || origin === 'Shiden')

    const shouldUseMultiasset = isAstarOrShidenToRelay || (isAssetHubDest && !isBifrostOrigin)

    const modifiedCurrencySelection = getCurrencySelection(
      input,
      shouldUseMultiasset,
      currencySelection
    )

    const section: TXTokensSection = shouldUseMultiasset
      ? feeAsset
        ? 'transfer_multiassets'
        : 'transfer_multiasset'
      : 'transfer'

    const parameters = getXTokensParameters(
      shouldUseMultiasset,
      modifiedCurrencySelection,
      addressSelection,
      amount,
      fees,
      feeAsset
    )

    const call: TSerializedApiCall = {
      module: 'XTokens',
      section,
      parameters
    }

    return api.callTxMethod(call)
  }
}

export default XTokensTransferImpl
