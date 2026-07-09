import { InvalidCurrencyError, type TAssetInfo, type TAssetWithFee } from '@paraspell/assets'

import type { TSubstrateTransferOptions } from '../../types'
import { createAsset, getChainVersion, sortAssets } from '../../utils'
import { resolveCurrency } from './resolveCurrency'
import { validateAssetSupport } from './validateAssetSupport'
import { assertNotRawAssets } from './validationUtils'

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

    assertNotRawAssets(currency)

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
        ...createAsset(version, asset.amount, asset.location)
      }))
    )
  }

  return undefined
}
