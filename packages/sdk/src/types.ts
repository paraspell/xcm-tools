import type { TApiOrUrl } from '@paraspell/sdk-core'
import type { TEvmChainFrom } from '@paraspell/sdk-core'
import type { PolkadotClient, PolkadotSigner, UnsafeTransaction } from 'polkadot-api'

export type TPapiApi = PolkadotClient
export type TPapiApiOrUrl = TApiOrUrl<PolkadotClient>
export type TPapiSigner = PolkadotSigner

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TPapiTransaction = UnsafeTransaction<any, string, string, any>

export type TEvmChainFromPapi = Extract<TEvmChainFrom, 'Moonbeam' | 'Moonriver' | 'Darwinia'>
