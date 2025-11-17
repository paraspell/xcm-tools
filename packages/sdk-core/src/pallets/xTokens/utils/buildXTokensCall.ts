import type { TPallet } from '@paraspell/pallets'
import { isTLocation } from '@paraspell/sdk-common'

import type {
  TSerializedExtrinsics,
  TXTokensCurrencySelection,
  TXTokensMethod,
  TXTokensTransferOptions
} from '../../../types'
import { createBeneficiaryLocXTokens } from '../../../utils'
import { getModifiedCurrencySelection } from './currencySelection'
import { getXTokensParams } from './getXTokensParams'

export const shouldUseMultiAssetTransfer = <TApi, TRes>({
  origin,
  destination,
  scenario,
  overriddenAsset,
  useMultiAssetTransfer
}: TXTokensTransferOptions<TApi, TRes>) => {
  const isAstarOrShidenToRelay =
    scenario === 'ParaToRelay' && (origin === 'Astar' || origin === 'Shiden')
  const isBifrostOrigin = origin === 'BifrostPolkadot' || origin === 'BifrostKusama'
  const isAssetHubDest = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'
  const isOverriddenMultiAssets = overriddenAsset && !isTLocation(overriddenAsset)

  return (
    useMultiAssetTransfer ||
    isAstarOrShidenToRelay ||
    (isAssetHubDest && !isBifrostOrigin) ||
    !!isOverriddenMultiAssets
  )
}

export const getXTokensMethod = <TApi, TRes>(
  useMultiAsset: boolean,
  overriddenAsset: TXTokensTransferOptions<TApi, TRes>['overriddenAsset']
): TXTokensMethod => {
  if (!useMultiAsset) return 'transfer'

  const isOverriddenMultiAssets = overriddenAsset && !isTLocation(overriddenAsset)

  return isOverriddenMultiAssets ? 'transfer_multiassets' : 'transfer_multiasset'
}

export const buildXTokensCall = <TApi, TRes>(
  input: TXTokensTransferOptions<TApi, TRes>,
  currencySelection: TXTokensCurrencySelection,
  fees: string | number
): TSerializedExtrinsics => {
  const {
    api,
    origin,
    destination,
    overriddenAsset,
    address,
    asset,
    pallet,
    version,
    paraIdTo,
    method: methodOverride
  } = input

  const useMultiAsset = shouldUseMultiAssetTransfer(input)

  const modifiedCurrencySelection = useMultiAsset
    ? getModifiedCurrencySelection(input)
    : currencySelection

  const method = getXTokensMethod(useMultiAsset, overriddenAsset)

  const destLocation = createBeneficiaryLocXTokens({
    api,
    origin,
    destination,
    address: address,
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
