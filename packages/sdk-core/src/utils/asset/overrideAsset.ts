import type { TAsset } from '@paraspell/assets'
import { isTLocation, type TLocation, type Version } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import { createAsset } from './createAsset'

export const maybeOverrideAssets = (
  version: Version,
  amount: bigint,
  assets: TAsset[],
  overriddenCurrency?: TLocation | TAsset[]
) => {
  if (!overriddenCurrency) {
    return assets
  }

  return isTLocation(overriddenCurrency)
    ? createAsset(version, amount, overriddenCurrency)
    : overriddenCurrency
}

export const maybeOverrideAsset = (
  version: Version,
  amount: bigint,
  asset: TAsset,
  overriddenCurrency?: TLocation | TAsset[]
): TAsset => {
  if (!overriddenCurrency) {
    return asset
  }

  if (Array.isArray(overriddenCurrency)) {
    if (overriddenCurrency.length !== 1) {
      throw new InvalidParameterError('Expected a single asset in overriddenCurrency array.')
    }
    return overriddenCurrency[0]
  }

  return createAsset(version, amount, overriddenCurrency)
}
