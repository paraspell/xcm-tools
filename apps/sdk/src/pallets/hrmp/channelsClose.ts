import type { ApiPromise } from '@polkadot/api'
import { Extrinsic, TNode } from '../../types'
import { getParaId } from '../assets'

export function closeChannel(
  api: ApiPromise,
  origin: TNode,
  inbound: number,
  outbound: number
): Extrinsic {
  return api.tx.sudo.sudo(api.tx.hrmp.forceCleanHrmp(getParaId(origin), inbound, outbound))
}
