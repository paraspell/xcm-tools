import type { TApiOrUrl } from '@paraspell/sdk-core'
import type { ApiPromise } from '@polkadot/api'
import { type SubmittableExtrinsic } from '@polkadot/api/types'

export type TPjsApi = ApiPromise
export type TPjsApiOrUrl = TApiOrUrl<TPjsApi>

export type Extrinsic = SubmittableExtrinsic<'promise'>
