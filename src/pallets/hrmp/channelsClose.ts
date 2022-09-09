import type { ApiPromise } from '@polkadot/api'

export function closeChannel(api: ApiPromise, origin: number, inbound: number, outbound: number) {
    return api.tx.hrmp.forceCleanHrmp(origin,inbound,outbound)
}