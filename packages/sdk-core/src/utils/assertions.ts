import type { TAssetWithLocation, TForeignAssetInfo, TForeignAssetWithId } from '@paraspell/assets'
import { InvalidCurrencyError, isForeignAsset, type TAssetInfo } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { isTLocation, replaceBigInt } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../errors'
import type { TAddress, TDestination } from '../types'

export const assertToIsString: (
  to: TDestination,
  overrideMsg?: string
) => asserts to is Exclude<TDestination, TLocation> = (to, overrideMsg) => {
  if (isTLocation(to)) {
    throw new InvalidParameterError(
      overrideMsg ?? 'Location destination is not supported for XCM fee calculation.'
    )
  }
}

export const assertAddressIsString: (
  address: TAddress
) => asserts address is Exclude<TAddress, TLocation> = address => {
  if (isTLocation(address)) {
    throw new InvalidParameterError('Location address is not supported for this transfer type.')
  }
}

export const assertHasLocation: (
  asset: TAssetInfo
) => asserts asset is TAssetWithLocation = asset => {
  if (!asset.location) {
    throw new InvalidCurrencyError(
      `Asset ${JSON.stringify(asset, replaceBigInt)} is missing location`
    )
  }
}

export const assertHasId: (asset: TAssetInfo) => asserts asset is TForeignAssetWithId = asset => {
  assertIsForeign(asset)
  if (asset.assetId === undefined) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset, replaceBigInt)} has no assetId`)
  }
}

export const assertIsForeign: (asset: TAssetInfo) => asserts asset is TForeignAssetInfo = asset => {
  if (!isForeignAsset(asset)) {
    throw new InvalidCurrencyError(
      `Asset ${JSON.stringify(asset, replaceBigInt)} is not a foreign asset`
    )
  }
}
