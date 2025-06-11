import type { TPallet } from '@paraspell/pallets'
import { isTMultiLocation } from '@paraspell/sdk-common'

import type {
  TSerializedApiCall,
  TXTokensCurrencySelection,
  TXTokensMethod,
  TXTokensTransferOptions
} from '../../../types'
import { getModifiedCurrencySelection } from './currencySelection'
import { getXTokensParameters } from './getXTokensParameters'

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
  const isOverriddenMultiAssets = overriddenAsset && !isTMultiLocation(overriddenAsset)

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

  const isOverriddenMultiAssets = overriddenAsset && !isTMultiLocation(overriddenAsset)

  return isOverriddenMultiAssets ? 'transfer_multiassets' : 'transfer_multiasset'
}

export const buildXTokensCall = <TApi, TRes>(
  input: TXTokensTransferOptions<TApi, TRes>,
  currencySelection: TXTokensCurrencySelection,
  fees: string | number
): TSerializedApiCall => {
  const { overriddenAsset, destLocation, asset, pallet, version, method: methodOverride } = input

  const useMultiAsset = shouldUseMultiAssetTransfer(input)

  const modifiedCurrencySelection = useMultiAsset
    ? getModifiedCurrencySelection(input)
    : currencySelection

  const method = getXTokensMethod(useMultiAsset, overriddenAsset)

  const parameters = getXTokensParameters(
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
    parameters
  }
}
