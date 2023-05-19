//Contains call formatting for opening HRMP channels functionality

import type { ApiPromise } from '@polkadot/api'
import { Extrinsic, TNode } from '../../types'
import { getParaId } from '../assets'

export function openChannel(
  api: ApiPromise,
  origin: TNode,
  destination: TNode,
  maxSize: number,
  maxMessageSize: number
): Extrinsic {
  return api.tx.sudo.sudo(
    api.tx.parasSudoWrapper.sudoEstablishHrmpChannel(
      getParaId(origin),
      getParaId(destination),
      maxSize,
      maxMessageSize
    )
  )
}
