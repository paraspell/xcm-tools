// Contains call formatting for opening HRMP channels functionality

import type { ApiPromise } from '@polkadot/api'
import { type Extrinsic, type TNode, type TSerializedApiCall } from '../../types'
import { getParaId } from '../assets'

const openChannelInternal = (
  api: ApiPromise,
  origin: TNode,
  destination: TNode,
  maxSize: number,
  maxMessageSize: number,
  serializedApiCallEnabled = false
): Extrinsic | TSerializedApiCall => {
  const module = 'parasSudoWrapper'
  const section = 'sudoEstablishHrmpChannel'
  const parameters = [getParaId(origin), getParaId(destination), maxSize, maxMessageSize]

  if (serializedApiCallEnabled) {
    return {
      module,
      section,
      parameters
    }
  }

  return api.tx.sudo.sudo(api.tx[module][section](...parameters))
}

export function openChannel(
  api: ApiPromise,
  origin: TNode,
  destination: TNode,
  maxSize: number,
  maxMessageSize: number
): Extrinsic {
  return openChannelInternal(api, origin, destination, maxSize, maxMessageSize) as Extrinsic
}

export function openChannelSerializedApiCall(
  api: ApiPromise,
  origin: TNode,
  destination: TNode,
  maxSize: number,
  maxMessageSize: number
): TSerializedApiCall {
  return openChannelInternal(
    api,
    origin,
    destination,
    maxSize,
    maxMessageSize,
    true
  ) as TSerializedApiCall
}
