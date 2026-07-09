import type { TPallet } from '@paraspell/pallets'

import type {
  TSerializedExtrinsics,
  TXTokensCurrencySelection,
  TXTokensMethod,
  TXTokensTransferOptions
} from '../../../types'
import { createBeneficiaryLocXTokens } from '../../../utils'
import { getModifiedCurrencySelection } from './currencySelection'
import { getXTokensParams } from './getXTokensParams'

export const getXTokensMethod = <TApi, TRes, TSigner>(
  useMultiAsset: boolean,
  overriddenAsset: TXTokensTransferOptions<TApi, TRes, TSigner>['overriddenAsset']
): TXTokensMethod => {
  if (!useMultiAsset) return 'transfer'

  return overriddenAsset ? 'transfer_multiassets' : 'transfer_multiasset'
}

export const buildXTokensCall = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  input: TXTokensTransferOptions<TApi, TRes, TSigner, TCustomChain>,
  currencySelection: TXTokensCurrencySelection,
  fees: string | number
): TSerializedExtrinsics => {
  const {
    api,
    origin,
    destination,
    overriddenAsset,
    useMultiAssetTransfer,
    recipient,
    asset,
    pallet,
    version,
    paraIdTo,
    method: methodOverride
  } = input

  const useMultiAsset = useMultiAssetTransfer || !!overriddenAsset

  const modifiedCurrencySelection = useMultiAsset
    ? getModifiedCurrencySelection(input)
    : currencySelection

  const method = getXTokensMethod(useMultiAsset, overriddenAsset)

  const destLocation = createBeneficiaryLocXTokens({
    api,
    origin,
    destination,
    recipient,
    version,
    paraId: paraIdTo
  })

  const params = getXTokensParams(
    useMultiAsset,
    modifiedCurrencySelection,
    destLocation,
    asset.amount,
    fees,
    version,
    overriddenAsset
  )

  return {
    module: (pallet as TPallet) ?? 'XTokens',
    method: methodOverride ?? method,
    params
  }
}
