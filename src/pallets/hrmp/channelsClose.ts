// Contains call formatting for closing HRMP channels functionality

import type { ApiPromise } from '@polkadot/api'
import { type Extrinsic, type TNode, type TSerializedApiCall } from '../../types'
import { getParaId } from '../assets'

const closeChannelInternal = (
  api: ApiPromise,
  origin: TNode,
  inbound: number,
  outbound: number,
  serializedApiCallEnabled = false
): Extrinsic | TSerializedApiCall => {
  const module = 'hrmp'
  const section = 'forceCleanHrmp'
  const parameters = [getParaId(origin), inbound, outbound]

  if (serializedApiCallEnabled) {
    return {
      module,
      section,
      parameters
    }
  }

  return api.tx.sudo.sudo(api.tx[module][section](...parameters))
}

export const closeChannel = (
  api: ApiPromise,
  origin: TNode,
  inbound: number,
  outbound: number
): Extrinsic => closeChannelInternal(api, origin, inbound, outbound) as Extrinsic

export const closeChannelSerializedApiCall = (
  api: ApiPromise,
  origin: TNode,
  inbound: number,
  outbound: number
): TSerializedApiCall =>
  closeChannelInternal(api, origin, inbound, outbound, true) as TSerializedApiCall
