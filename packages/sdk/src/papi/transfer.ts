import type { ApiPromise } from '@polkadot/api'
import { createPapiApiCall } from './utils'
import * as transferImpl from '../pallets/xcmPallet/transfer'
import { send as sendImpl } from '../pallets/xcmPallet/transfer'
import type { PolkadotClient } from 'polkadot-api'
import type { TPapiTransaction } from './types'

export const transferRelayToPara = createPapiApiCall(
  transferImpl.transferRelayToPara<PolkadotClient, TPapiTransaction>
)

export const transferRelayToParaSerializedApiCall = createPapiApiCall(
  transferImpl.transferRelayToParaSerializedApiCall<ApiPromise, TPapiTransaction>
)

export const send = createPapiApiCall(sendImpl<ApiPromise, TPapiTransaction>)

export const sendSerializedApiCall = createPapiApiCall(
  transferImpl.sendSerializedApiCall<ApiPromise, TPapiTransaction>
)

export * from '../pallets/xcmPallet/ethTransfer'
