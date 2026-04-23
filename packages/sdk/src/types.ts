import type { TChain, TSwapEvent as TSwapEventBase } from '@paraspell/sdk-core'
import type { PolkadotClient, PolkadotSigner, Transaction } from 'polkadot-api'

export type TPapiApi = PolkadotClient
export type TPapiSigner = PolkadotSigner

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TPapiTransaction = Transaction<any, any>

export type TEvmChainFrom = Extract<TChain, 'Moonbeam' | 'Moonriver' | 'Darwinia'>

export type TSwapEvent = TSwapEventBase<TPapiApi, TPapiTransaction>
