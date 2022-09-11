import type { ApiPromise } from '@polkadot/api'
import { Extrinsic } from '../../types'

/* eslint-disable */
export function closeChannel(api: ApiPromise, origin: number, inbound: number, outbound: number): Extrinsic {
    return api.tx.sudo.sudo(api.tx.hrmp.forceCleanHrmp(origin,inbound,outbound))
}