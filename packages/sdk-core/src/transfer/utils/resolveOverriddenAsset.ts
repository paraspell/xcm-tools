import {
  InvalidCurrencyError,
  isOverrideLocationSpecifier,
  type TAssetInfo,
  type TAssetWithFee
} from '@paraspell/assets'
import { type TLocation } from '@paraspell/sdk-common'

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
): TLocation | TAssetWithFee[] | undefined => {
  const { api, currency, feeAsset, from: origin, to: destination } = options
  if ('location' in currency && isOverrideLocationSpecifier(currency.location)) {
    return currency.location.value
  }

  if (Array.isArray(currency)) {
    if (!feeAsset) {
      throw new InvalidCurrencyError(
        'Overridden assets cannot be used without specifying fee asset'
      )
    }

    if ('location' in feeAsset && isOverrideLocationSpecifier(feeAsset.location)) {
      throw new InvalidCurrencyError('Fee asset cannot be an overridden location specifier')
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
