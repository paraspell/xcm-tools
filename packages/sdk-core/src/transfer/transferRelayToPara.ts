import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import { InvalidParameterError } from '../errors'
import { resolveTNodeFromLocation } from '../pallets/xcmPallet/utils'
import type { TRelayToParaOptions } from '../types'
import { getNode } from '../utils'

export const transferRelayToPara = async <TApi, TRes>(
  options: TRelayToParaOptions<TApi, TRes>
): Promise<TRes> => {
  const {
    api,
    origin,
    destination,
    assetInfo: asset,
    address,
    paraIdTo,
    version,
    pallet,
    method
  } = options
  const isLocationDestination = typeof destination === 'object'

  if (api.getConfig() === undefined && isLocationDestination) {
    throw new InvalidParameterError('API is required when using location as destination.')
  }

  await api.init(origin, TX_CLIENT_TIMEOUT_MS)

  const serializedApiCall = getNode(
    isLocationDestination ? resolveTNodeFromLocation(origin, destination) : destination
  ).transferRelayToPara({
    api,
    origin,
    destination,
    address,
    paraIdTo,
    assetInfo: asset,
    version,
    pallet,
    method
  })

  return api.callTxMethod(serializedApiCall)
}
