import type { TAssetInfo } from '@paraspell/assets'
import { isTAsset, type TCurrencyInput } from '@paraspell/assets'
import { isTLocation, type TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import type { TDestination } from '../../types'
import { throwUnsupportedCurrency } from '../../utils'

export const resolveFeeAsset = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  feeAsset: TCurrencyInput,
  origin: TSubstrateChain | TCustomChain,
  destination: TDestination,
  currency: TCurrencyInput
): TAssetInfo | undefined => {
  if (!origin.startsWith('Hydration') && origin !== 'AssetHubPolkadot') {
    throw new ScenarioNotSupportedError(`Fee asset is not supported on ${origin}`)
  }

  const dest = !isTLocation(destination) ? destination : null
  const asset = api.findAssetInfo(origin, feeAsset, dest)

  const usesRawOverriddenMultiAssets = Array.isArray(currency) && currency.every(isTAsset)

  if (!asset && !usesRawOverriddenMultiAssets) {
    throwUnsupportedCurrency(feeAsset, origin)
  }

  return asset ?? undefined
}
