// Contains call formatting for opening HRMP channels functionality

import {
  type TOpenChannelInternalOptions,
  type Extrinsic,
  type TSerializedApiCall,
  type TOpenChannelOptions
} from '../../types'
import { getParaId } from '../assets'

const openChannelInternal = (
  options: TOpenChannelInternalOptions
): Extrinsic | TSerializedApiCall => {
  const {
    api,
    origin,
    destination,
    maxSize,
    maxMessageSize,
    serializedApiCallEnabled = false
  } = options
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

export const openChannel = (options: TOpenChannelOptions): Extrinsic =>
  openChannelInternal(options) as Extrinsic

export const openChannelSerializedApiCall = (options: TOpenChannelOptions): TSerializedApiCall =>
  openChannelInternal({ ...options, serializedApiCallEnabled: true }) as TSerializedApiCall
