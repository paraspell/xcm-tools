import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic, TSerializedApiCall } from '../types'
import PolkadotJsApi from '../api/PolkadotJsApi'

export const callPolkadotJsTxFunction = (
  api: ApiPromise,
  serializedCall: TSerializedApiCall
): Extrinsic => {
  const polkadotJsApi = new PolkadotJsApi()
  polkadotJsApi.init(api)
  return polkadotJsApi.call(serializedCall)
}
