import { InvalidCurrencyError, type TAssetInfo, type TAssetWithFee } from '@paraspell/assets'

import { MIN_AMOUNT } from '../../constants'
import type { TSubstrateTransferOptions } from '../../types'
import { createAsset, getChainVersion, sortAssets } from '../../utils'
import { resolveCurrency } from './resolveCurrency'
import { validateAssetSupport } from './validateAssetSupport'

export const resolveOverriddenAsset = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TSubstrateTransferOptions<TApi, TRes, TSigner, TCustomChain>,
  isBridge: boolean,
  assetCheckEnabled: boolean,
  resolvedFeeAsset: TAssetInfo | undefined
): TAssetWithFee[] | undefined => {
  const { api, currency, feeAsset, from: origin, to: destination } = options

  if (Array.isArray(currency)) {
    if (!feeAsset) {
      throw new InvalidCurrencyError(
        'Overridden assets cannot be used without specifying fee asset'
      )
    }

    const version = getChainVersion(api, origin)

    const { assets } = resolveCurrency(
      api,
      currency,
      resolvedFeeAsset,
      origin,
      destination,
      asset => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)
    )

    return sortAssets(
      assets.map(asset => ({
        isFeeAsset: asset.isFeeAsset,
        // Clamp each multi-asset amount the same way the single-asset path does
        // (see resolveTransferParams): an amount that floors to 0 plancks builds a
        // zero-value Fungible, which panics the origin runtime in
        // DryRunApi_dry_run_call instead of returning a validation error.
        ...createAsset(
          version,
          asset.amount < MIN_AMOUNT ? MIN_AMOUNT : asset.amount,
          asset.location
        )
      }))
    )
  }

  return undefined
}
