// Contains basic structure of xToken call

import type { TPallet } from '@paraspell/pallets'
import { isTMultiLocation } from '@paraspell/sdk-common'

import type {
  TSerializedApiCall,
  TXTokensCurrencySelection,
  TXTokensSection,
  TXTokensTransferOptions
} from '../../types'
import { getCurrencySelection } from './utils/getCurrencySelection'
import { getXTokensParameters } from './utils/getXTokensParameters'

class XTokensTransferImpl {
  static transferXTokens<TApi, TRes>(
    input: TXTokensTransferOptions<TApi, TRes>,
    currencySelection: TXTokensCurrencySelection,
    fees: string | number = 'Unlimited'
  ): TRes {
    const {
      api,
      origin,
      asset,
      addressSelection,
      destination,
      scenario,
      overriddenAsset,
      pallet,
      method
    } = input

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
    const isTuring = origin === 'Turing'
    const isOverridenMultiAssets = overriddenAsset && !isTMultiLocation(overriddenAsset)

    const shouldUseMultiasset =
      isTuring ||
      isAstarOrShidenToRelay ||
      (isAssetHubDest && !isBifrostOrigin) ||
      !!isOverridenMultiAssets

    const modifiedCurrencySelection = getCurrencySelection(
      input,
      shouldUseMultiasset,
      currencySelection
    )

    const section: TXTokensSection = shouldUseMultiasset
      ? isOverridenMultiAssets
        ? 'transfer_multiassets'
        : 'transfer_multiasset'
      : 'transfer'

    const parameters = getXTokensParameters(
      shouldUseMultiasset,
      modifiedCurrencySelection,
      addressSelection,
      asset.amount,
      fees,
      overriddenAsset
    )

    const call: TSerializedApiCall = {
      module: (pallet as TPallet) ?? 'XTokens',
      section: method ?? section,
      parameters
    }

    return api.callTxMethod(call)
  }
}

export default XTokensTransferImpl
