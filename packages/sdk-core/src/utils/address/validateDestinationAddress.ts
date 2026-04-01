import { isTLocation } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import type { TAddress, TDestination } from '../../types'
import { validateAddress } from './validateAddress'

export const validateDestinationAddress = <TApi, TRes, TSigner>(
  address: TAddress,
  destination: TDestination,
  api: PolkadotApi<TApi, TRes, TSigner>
) => {
  if (typeof address === 'string' && !isTLocation(destination)) {
    validateAddress(api, address, destination, true)
  }
}
