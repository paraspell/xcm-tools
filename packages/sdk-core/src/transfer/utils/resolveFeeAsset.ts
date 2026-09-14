import type { TAssetInfo, TCurrencyInput, WithOptionalAmount } from '@paraspell/assets'
import { InvalidCurrencyError, isAssetEqual } from '@paraspell/assets'
import { isExternalChain, isTLocation, type TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError, UnsupportedOperationError } from '../../errors'
import type { TDestination } from '../../types'
import { abstractDecimals, throwUnsupportedCurrency } from '../../utils'

export const resolveFeeAsset = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  feeAsset: TCurrencyInput,
  origin: TSubstrateChain | TCustomChain,
  destination: TDestination,
  currency: TCurrencyInput
): WithOptionalAmount<TAssetInfo> | undefined => {
  const dest = !isTLocation(destination) ? destination : null
  const asset = api.findAssetInfo(origin, feeAsset, dest)

  if (!asset) {
    return throwUnsupportedCurrency(feeAsset, origin)
  }

  if (!Array.isArray(currency)) {
    if (dest && isExternalChain(dest)) {
      const transferredAsset = api.findAssetInfo(origin, currency, dest)
      const relayAsset = api.findNativeAssetInfoOrThrow(api.getRelayChainOf(origin))

      if (
        !isAssetEqual(asset, relayAsset) &&
        !(transferredAsset && isAssetEqual(asset, transferredAsset))
      ) {
        throw new ScenarioNotSupportedError(
          'Only the relay chain native asset can be used as fee asset for Snowbridge transfers'
        )
      }
    }

    return asset
  }

  const feeElement = currency.find(item => {
    const resolved = api.findAssetInfo(origin, item, dest)
    return resolved !== null && isAssetEqual(resolved, asset)
  })

  if (!feeElement) {
    throw new InvalidCurrencyError('Fee asset must be one of the provided assets')
  }

  if (currency.length > 2) {
    throw new UnsupportedOperationError('Sending more than one non-fee asset is not yet supported')
  }

  return { ...asset, amount: abstractDecimals(feeElement.amount, asset.decimals, api) }
}
