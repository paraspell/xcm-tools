import { isTLocation } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import type { TAddress, TDestination } from '../../types'
import { validateAddress } from '../../utils/validateAddress'

export const validateDestinationAddress = <TApi, TRes>(
  address: TAddress,
  destination: TDestination,
  api: IPolkadotApi<TApi, TRes>
) => {
  if (typeof address === 'string' && !isTLocation(destination)) {
    validateAddress(api, address, destination, true)
  }
}
