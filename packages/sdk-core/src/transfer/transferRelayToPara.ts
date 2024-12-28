import { resolveTNodeFromMultiLocation } from '../pallets/xcmPallet/utils'
import type { TRelayToParaOptions } from '../types'
import { getNode } from '../utils'
import { isPjsClient } from '../utils/isPjsClient'
import { checkKeepAlive } from './keepAlive'

export const transferRelayToPara = async <TApi, TRes>(
  options: TRelayToParaOptions<TApi, TRes>
): Promise<TRes> => {
  const {
    api,
    origin,
    destination,
    asset,
    address,
    paraIdTo,
    destApiForKeepAlive,
    version,
    pallet,
    method
  } = options
  const isMultiLocationDestination = typeof destination === 'object'
  const isAddressMultiLocation = typeof address === 'object'

  if (api.getApiOrUrl() === undefined && isMultiLocationDestination) {
    throw new Error('API is required when using MultiLocation as destination.')
  }

  await api.init(origin)

  try {
    if (isMultiLocationDestination) {
      console.warn('Keep alive check is not supported when using MultiLocation as destination.')
    } else if (isAddressMultiLocation) {
      console.warn('Keep alive check is not supported when using MultiLocation as address.')
    } else {
      const destApi = destApiForKeepAlive ?? api.clone()
      await checkKeepAlive({
        api: api,
        address,
        destApi,
        asset,
        origin: origin,
        destination: destination
      })
    }

    const serializedApiCall = getNode(
      isMultiLocationDestination ? resolveTNodeFromMultiLocation(origin, destination) : destination
    ).transferRelayToPara({
      api,
      origin,
      destination,
      address,
      paraIdTo,
      destApiForKeepAlive,
      asset,
      version,
      pallet,
      method
    })

    return api.callTxMethod(serializedApiCall)
  } finally {
    if (isPjsClient(api.getApi())) {
      await api.disconnect()
    }
  }
}
