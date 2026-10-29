import type { TSwapEvent as TSwapEventBase } from '@paraspell/sdk-core'
import type { PolkadotClient, Transaction } from 'polkadot-api'
import type { InjectedPolkadotAccount } from 'polkadot-api/pjs-signer'

export type TPapiApi = PolkadotClient
export type TPapiSigner = InjectedPolkadotAccount['txCreator']

export type TPapiTransaction = Transaction

export type TSwapEvent = TSwapEventBase<TPapiApi, TPapiTransaction>
