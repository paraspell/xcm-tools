import type { TAddress, TDestination } from '../../../types'
import { isTMultiLocation } from '../utils'
import { validateAddress } from '../../../utils/validateAddress'

export const validateDestinationAddress = (
  address: TAddress,
  destination: TDestination | undefined
) => {
  if (typeof address === 'string' && destination && !isTMultiLocation(destination)) {
    validateAddress(address, destination)
  }
}
