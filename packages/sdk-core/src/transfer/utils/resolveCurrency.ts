import type {
  TAssetInfo,
  TCurrencyInputWithAmount,
  WithAmount,
  WithOptionalAmount
} from '@paraspell/assets'
import { InvalidCurrencyError, isAssetEqual } from '@paraspell/assets'
import { isTLocation, replaceBigInt, type TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { AMOUNT_ALL } from '../../constants'
import type { TDestination, TResolvedCurrency } from '../../types'
import { abstractDecimals } from '../../utils'
import { assertNotRawAssets } from './validationUtils'

export const resolveCurrency = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  currency: TCurrencyInputWithAmount,
  resolvedFeeAsset: WithOptionalAmount<TAssetInfo> | undefined,
  origin: TSubstrateChain | TCustomChain,
  destination: TDestination,
  onAsset?: (asset: TAssetInfo) => void
): TResolvedCurrency => {
  const dest = !isTLocation(destination) ? destination : null

  if (Array.isArray(currency)) {
    if (!resolvedFeeAsset) {
      throw new InvalidCurrencyError('Fee asset is required when providing more than one asset')
    }

    assertNotRawAssets(currency)

    const assets = currency.map((item): WithAmount<TAssetInfo> => {
      if (item.amount === AMOUNT_ALL) {
        throw new InvalidCurrencyError(
          'Provided assets cannot use amount all. Please specify amount.'
        )
      }

      const asset = api.findAssetInfo(origin, item, dest)

      if (!asset) {
        throw new InvalidCurrencyError(
          `Origin chain ${origin} does not support currency ${JSON.stringify(item, replaceBigInt)}`
        )
      }

      onAsset?.(asset)

      return {
        ...asset,
        amount: abstractDecimals(item.amount, asset.decimals, api),
        isFeeAsset: isAssetEqual(resolvedFeeAsset, asset)
      }
    })

    const feeAssetCount = assets.filter(asset => asset.isFeeAsset).length

    if (feeAssetCount > 1) {
      throw new InvalidCurrencyError(`Fee asset matches more than one of the provided assets`)
    }

    if (feeAssetCount === 0) {
      throw new InvalidCurrencyError(`Fee asset must be one of the provided assets`)
    }

    return { assets, asset: { ...resolvedFeeAsset, amount: resolvedFeeAsset.amount ?? 0n } }
  }

  const asset = api.findAssetInfoOrThrow(origin, currency, dest)
  const resolved = { ...asset, amount: abstractDecimals(currency.amount, asset.decimals, api) }

  return { assets: [resolved], asset: resolved }
}
