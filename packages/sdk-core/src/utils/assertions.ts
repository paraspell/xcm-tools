import type { TAssetWithLocation } from '@paraspell/assets'
import { InvalidCurrencyError, type TAsset } from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { isTMultiLocation } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../errors'
import type { TAddress, TDestination } from '../types'

export const assertToIsString: (
  to: TDestination,
  overrideMsg?: string
) => asserts to is Exclude<TDestination, TMultiLocation> = (to, overrideMsg) => {
  if (isTMultiLocation(to)) {
    throw new InvalidParameterError(
      overrideMsg ?? 'Multi-Location destination is not supported for XCM fee calculation.'
    )
  }
}

export const assertAddressIsString: (
  address: TAddress
) => asserts address is Exclude<TAddress, TMultiLocation> = address => {
  if (isTMultiLocation(address)) {
    throw new InvalidParameterError(
      'Multi-Location address is not supported for XCM fee calculation.'
    )
  }
}

export const assertHasLocation: (asset: TAsset) => asserts asset is TAssetWithLocation = asset => {
  if (!asset.multiLocation) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is missing multi-location`)
  }
}
