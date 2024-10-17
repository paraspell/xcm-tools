import type { ApiPromise } from '@polkadot/api'
import { createPolkadotJsApiCall } from './utils'
import type { Extrinsic } from './types'
import * as transferImpl from '../pallets/xcmPallet/transfer'
import { send as sendImpl } from '../pallets/xcmPallet/transfer'

export const transferRelayToPara = createPolkadotJsApiCall(
  transferImpl.transferRelayToPara<ApiPromise, Extrinsic>
)

export const transferRelayToParaSerializedApiCall = createPolkadotJsApiCall(
  transferImpl.transferRelayToParaSerializedApiCall<ApiPromise, Extrinsic>
)

export const send = createPolkadotJsApiCall(sendImpl<ApiPromise, Extrinsic>)

export const sendSerializedApiCall = createPolkadotJsApiCall(
  transferImpl.sendSerializedApiCall<ApiPromise, Extrinsic>
)

export * from '../pallets/xcmPallet/ethTransfer'
