import type { ApiPromise } from '@polkadot/api'
import type { TRuntimeApi } from './types'

export const supportsRuntimeApi = (api: ApiPromise, runtimeApi: TRuntimeApi) =>
  api.call[runtimeApi] !== undefined
