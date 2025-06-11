import type { TAmount, TMultiAsset } from '@paraspell/assets'
import { isTMultiLocation, type TMultiLocation, type Version } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import { createMultiAsset } from './createMultiAsset'

export const maybeOverrideMultiAssets = (
  version: Version,
  amount: TAmount,
  multiAssets: TMultiAsset[],
  overriddenCurrency?: TMultiLocation | TMultiAsset[]
) => {
  if (!overriddenCurrency) {
    return multiAssets
  }

  return isTMultiLocation(overriddenCurrency)
    ? [createMultiAsset(version, amount, overriddenCurrency)]
    : overriddenCurrency
}

export const maybeOverrideMultiAsset = (
  version: Version,
  amount: TAmount,
  multiAsset: TMultiAsset,
  overriddenCurrency?: TMultiLocation | TMultiAsset[]
): TMultiAsset => {
  if (!overriddenCurrency) {
    return multiAsset
  }

  if (Array.isArray(overriddenCurrency)) {
    if (overriddenCurrency.length !== 1) {
      throw new InvalidParameterError('Expected a single TMultiAsset in overriddenCurrency array.')
    }
    return overriddenCurrency[0]
  }

  return createMultiAsset(version, amount, overriddenCurrency)
}
