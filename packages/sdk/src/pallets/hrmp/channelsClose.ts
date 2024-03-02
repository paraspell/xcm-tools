// Contains call formatting for closing HRMP channels functionality

import {
  type TCloseChannelInternalOptions,
  type Extrinsic,
  type TSerializedApiCall,
  type TCloseChannelOptions
} from '../../types'
import { getParaId } from '../assets'

const closeChannelInternal = (
  options: TCloseChannelInternalOptions
): Extrinsic | TSerializedApiCall => {
  const { api, origin, inbound, outbound, serializedApiCallEnabled = false } = options
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

export const closeChannel = (options: TCloseChannelOptions): Extrinsic =>
  closeChannelInternal(options) as Extrinsic

export const closeChannelSerializedApiCall = (options: TCloseChannelOptions): TSerializedApiCall =>
  closeChannelInternal({ ...options, serializedApiCallEnabled: true }) as TSerializedApiCall
