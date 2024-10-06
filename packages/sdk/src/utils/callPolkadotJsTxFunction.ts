import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic, TSerializedApiCall } from '../types'

export const callPolkadotJsTxFunction = (
  api: ApiPromise,
  { module, section, parameters }: TSerializedApiCall
): Extrinsic => api.tx[module][section](...parameters)
