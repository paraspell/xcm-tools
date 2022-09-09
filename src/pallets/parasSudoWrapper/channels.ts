import type { ApiPromise } from '@polkadot/api'

export function openChannel(api: ApiPromise, origin: number, destination: number, maxSize: number, maxMessageSize: number) {
    return api.tx.parasSudoWrapper.sudoEstablishHrmpChannel(origin,destination,maxSize,maxMessageSize)
}


