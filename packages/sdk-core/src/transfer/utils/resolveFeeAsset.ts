import type { TAssetInfo, TCurrencyInput, WithOptionalAmount } from '@paraspell/assets'
import { InvalidCurrencyError, isAssetEqual } from '@paraspell/assets'
import { isTLocation, type TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import type { TDestination } from '../../types'
import { abstractDecimals, throwUnsupportedCurrency } from '../../utils'
import { assertNotRawAssets } from './validationUtils'

export const resolveFeeAsset = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  feeAsset: TCurrencyInput,
  origin: TSubstrateChain | TCustomChain,
  destination: TDestination,
  currency: TCurrencyInput
): WithOptionalAmount<TAssetInfo> | undefined => {
  if (
    !Array.isArray(currency) &&
    !origin.startsWith('Hydration') &&
    origin !== 'AssetHubPolkadot'
  ) {
    throw new ScenarioNotSupportedError(`Fee asset is not supported on ${origin}`)
  }

  assertNotRawAssets(currency)

  const dest = !isTLocation(destination) ? destination : null
  const asset = api.findAssetInfo(origin, feeAsset, dest)

  if (!asset) {
    return throwUnsupportedCurrency(feeAsset, origin)
  }

  if (!Array.isArray(currency)) {
    return asset
  }

  const feeElement = currency.find(item => {
    const resolved = api.findAssetInfo(origin, item, dest)
    return resolved !== null && isAssetEqual(resolved, asset)
  })

  if (!feeElement) {
    throw new InvalidCurrencyError('Fee asset must be one of the provided assets')
  }

  return { ...asset, amount: abstractDecimals(feeElement.amount, asset.decimals, api) }
}
