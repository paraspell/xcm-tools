import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import { resolveTNodeFromMultiLocation } from '../pallets/xcmPallet/utils'
import type { TRelayToParaOptions } from '../types'
import { getNode } from '../utils'

export const transferRelayToPara = async <TApi, TRes>(
  options: TRelayToParaOptions<TApi, TRes>
): Promise<TRes> => {
  const { api, origin, destination, asset, address, paraIdTo, version, pallet, method } = options
  const isMultiLocationDestination = typeof destination === 'object'

  if (api.getApiOrUrl() === undefined && isMultiLocationDestination) {
    throw new Error('API is required when using MultiLocation as destination.')
  }

  await api.init(origin, TX_CLIENT_TIMEOUT_MS)

  const serializedApiCall = getNode(
    isMultiLocationDestination ? resolveTNodeFromMultiLocation(origin, destination) : destination
  ).transferRelayToPara({
    api,
    origin,
    destination,
    address,
    paraIdTo,
    asset,
    version,
    pallet,
    method
  })

  return api.callTxMethod(serializedApiCall)
}
