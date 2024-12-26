import { type SubmittableExtrinsic } from '@polkadot/api/types'
import type { ApiPromise } from '@polkadot/api'
import type { TApiOrUrl } from '@paraspell/sdk-core'

export type TPjsApi = ApiPromise
export type TPjsApiOrUrl = TApiOrUrl<TPjsApi>

export type Extrinsic = SubmittableExtrinsic<'promise'>
