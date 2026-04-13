import type { TSwapEvent as TSwapEventBase } from '@paraspell/sdk-core'
import type { TEvmChainFrom } from '@paraspell/sdk-core'
import type { PolkadotClient, PolkadotSigner, Transaction } from 'polkadot-api'

export type TPapiApi = PolkadotClient
export type TPapiSigner = PolkadotSigner

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TPapiTransaction = Transaction<any, any>

export type TEvmChainFromPapi = Extract<TEvmChainFrom, 'Moonbeam' | 'Moonriver' | 'Darwinia'>

export type TSwapEvent = TSwapEventBase<TPapiApi, TPapiTransaction>
