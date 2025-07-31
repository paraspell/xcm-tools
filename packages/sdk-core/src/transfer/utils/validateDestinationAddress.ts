import { isTLocation } from '@paraspell/sdk-common'

import type { TAddress, TDestination } from '../../types'
import { validateAddress } from '../../utils/validateAddress'

export const validateDestinationAddress = (address: TAddress, destination: TDestination) => {
  if (typeof address === 'string' && !isTLocation(destination)) {
    validateAddress(address, destination)
  }
}
