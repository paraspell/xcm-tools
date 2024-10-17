import type { PolkadotClient } from 'polkadot-api'
import * as transferImpl from '../pallets/xcmPallet/transfer'
import type { TRelayToParaOptions, TSendOptions } from '../types'
import PapiApi from './PapiApi'
import type { TPapiTransaction } from './types'

/**
 * Transfers assets from relay chain to parachain.
 *
 * @param options - The transfer options.
 *
 * @returns An extrinsic to be signed and sent.
 */
export const transferRelayToPara = (
  options: Omit<
    TRelayToParaOptions<PolkadotClient, TPapiTransaction>,
    'api' | 'destApiForKeepAlive'
  > & {
    api: PolkadotClient
    destApiForKeepAlive: PolkadotClient
  }
) => {
  const papiApi = new PapiApi()
  papiApi.setApi(options.api)
  const destPapiApi = new PapiApi()
  destPapiApi.setApi(options.destApiForKeepAlive)
  return transferImpl.transferRelayToPara<PolkadotClient, TPapiTransaction>({
    ...options,
    api: papiApi,
    destApiForKeepAlive: destPapiApi
  })
}

export const transferRelayToParaSerializedApiCall = (
  options: Omit<
    TRelayToParaOptions<PolkadotClient, TPapiTransaction>,
    'api' | 'destApiForKeepAlive'
  > & {
    api: PolkadotClient
    destApiForKeepAlive: PolkadotClient
  }
) => {
  const papiApi = new PapiApi()
  papiApi.setApi(options.api)
  const destPapiApi = new PapiApi()
  destPapiApi.setApi(options.destApiForKeepAlive)
  return transferImpl.transferRelayToParaSerializedApiCall<PolkadotClient, TPapiTransaction>({
    ...options,
    api: papiApi,
    destApiForKeepAlive: destPapiApi
  })
}

/**
 * Transfers assets from parachain to another parachain or relay chain.
 * @param options - The transfer options.
 * @returns An extrinsic to be signed and sent.
 */
export const send = (
  options: Omit<TSendOptions<PolkadotClient, TPapiTransaction>, 'api' | 'destApiForKeepAlive'> & {
    api: PolkadotClient
    destApiForKeepAlive: PolkadotClient
  }
) => {
  const papiApi = new PapiApi()
  papiApi.setApi(options.api)
  const destPapiApi = new PapiApi()
  destPapiApi.setApi(options.destApiForKeepAlive)
  return transferImpl.send({
    ...options,
    api: papiApi,
    destApiForKeepAlive: destPapiApi
  })
}

export const sendSerializedApiCall = (
  options: Omit<TSendOptions<PolkadotClient, TPapiTransaction>, 'api' | 'destApiForKeepAlive'> & {
    api: PolkadotClient
    destApiForKeepAlive: PolkadotClient
  }
) => {
  const papiApi = new PapiApi()
  papiApi.setApi(options.api)
  const destPapiApi = new PapiApi()
  destPapiApi.setApi(options.destApiForKeepAlive)
  return transferImpl.sendSerializedApiCall({
    ...options,
    api: destPapiApi,
    destApiForKeepAlive: destPapiApi
  })
}

export * from '../pallets/xcmPallet/ethTransfer'
