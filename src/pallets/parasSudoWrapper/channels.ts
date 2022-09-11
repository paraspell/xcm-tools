import type { ApiPromise } from '@polkadot/api'
import { Extrinsic, ExtrinsicFunction } from '../../types'

/* eslint-disable */
export function openChannel(api: ApiPromise, origin: number, destination: number, maxSize: number, maxMessageSize: number): Extrinsic {
    return api.tx.parasSudoWrapper.sudoEstablishHrmpChannel(origin,destination,maxSize,maxMessageSize)
}


