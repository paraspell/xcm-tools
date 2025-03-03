import type { TApiOrUrl } from '@paraspell/sdk-core'
import type { TEvmNodeFrom } from '@paraspell/sdk-core/src'
import type { PolkadotClient, UnsafeTransaction } from 'polkadot-api'

export type TPapiApi = PolkadotClient
export type TPapiApiOrUrl = TApiOrUrl<PolkadotClient>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TPapiTransaction = UnsafeTransaction<any, string, string, any>

export type TEvmNodeFromPapi = Extract<TEvmNodeFrom, 'Moonbeam' | 'Moonriver' | 'Darwinia'>
