import type { TMultiLocation } from '@paraspell/sdk-common'
import { isTMultiLocation } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import type { TAddress, TDestination } from '../../types'

export const assertToIsString: (
  to: TDestination
) => asserts to is Exclude<TDestination, TMultiLocation> = to => {
  if (isTMultiLocation(to)) {
    throw new InvalidParameterError(
      'Multi-Location destination is not supported for XCM fee calculation.'
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
