import type { TSwapEvent as TSwapEventBase } from '@paraspell/sdk-core'
import type { PolkadotClient, Transaction } from 'polkadot-api'
import type { RawTxCreator } from 'polkadot-api/tx-creator'

export type TPapiApi = PolkadotClient
export type TPapiSigner = RawTxCreator

export type TPapiTransaction = Transaction

export type TSwapEvent = TSwapEventBase<TPapiApi, TPapiTransaction>
