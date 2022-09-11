import type { ApiPromise } from '@polkadot/api'
import { Extrinsic, ExtrinsicFunction } from '../../types'
import { SubmittableExtrinsic } from '@polkadot/api/types'

/* eslint-disable */
export function closeChannel(api: ApiPromise, origin: number, inbound: number, outbound: number): Extrinsic {
    return api.tx.hrmp.forceCleanHrmp(origin,inbound,outbound)
}