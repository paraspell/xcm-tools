import { isRelayChain } from '.'
import { getParaId } from '../nodes/config'
import { isTMultiLocation } from '../pallets/xcmPallet/utils'
import type { TDestination } from '../types'

export const resolveParaId = (paraId: number | undefined, destination: TDestination) => {
  if (isTMultiLocation(destination) || isRelayChain(destination) || destination === 'Ethereum') {
    return undefined
  }

  return paraId ?? getParaId(destination)
}
