import type { TSwapEvent as TSwapEventBase } from '@paraspell/sdk-core'
import type { CommonSignerTxCreator } from '@polkadot-api/signers-common'
import type { PolkadotClient, Transaction } from 'polkadot-api'

export type TPapiApi = PolkadotClient
export type TPapiSigner = CommonSignerTxCreator

export type TPapiTransaction = Transaction

export type TSwapEvent = TSwapEventBase<TPapiApi, TPapiTransaction>
