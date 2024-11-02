import type { PolkadotClient, UnsafeTransaction } from 'polkadot-api'
import type { TApiOrUrl } from '../types/TApi'

export type TPapiApi = PolkadotClient
export type TPapiApiOrUrl = TApiOrUrl<PolkadotClient>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TPapiTransaction = UnsafeTransaction<any, string, string, any>
