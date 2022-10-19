import type { ApiPromise } from '@polkadot/api'
import { Extrinsic } from '../../types'

export function openChannel(
  api: ApiPromise,
  origin: number,
  destination: number,
  maxSize: number,
  maxMessageSize: number
): Extrinsic {
  return api.tx.sudo.sudo(
    api.tx.parasSudoWrapper.sudoEstablishHrmpChannel(
      origin,
      destination,
      maxSize,
      maxMessageSize
    )
  )
}
