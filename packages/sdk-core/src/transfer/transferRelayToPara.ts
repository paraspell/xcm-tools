import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import { InvalidParameterError } from '../errors'
import { resolveTChainFromLocation } from '../pallets/xcmPallet/utils'
import type { TRelayToParaOptions } from '../types'
import { getChain } from '../utils'

export const transferRelayToPara = async <TApi, TRes>(
  options: TRelayToParaOptions<TApi, TRes>
): Promise<TRes> => {
  const { api, origin, destination } = options
  const isLocationDestination = typeof destination === 'object'

  if (api.getConfig() === undefined && isLocationDestination) {
    throw new InvalidParameterError('API is required when using location as destination.')
  }

  await api.init(origin, TX_CLIENT_TIMEOUT_MS)

  const serializedCall = await getChain(
    isLocationDestination ? resolveTChainFromLocation(origin, destination) : destination
  ).transferRelayToPara(options)

  return api.deserializeExtrinsics(serializedCall)
}
