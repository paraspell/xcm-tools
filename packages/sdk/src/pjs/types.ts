import { type SubmittableExtrinsic } from '@polkadot/api/types'
import type { TApiOrUrl } from '../types/TApi'
import type { ApiPromise } from '@polkadot/api'

export type TPjsApi = ApiPromise
export type TPjsApiOrUrl = TApiOrUrl<TPjsApi>

export type Extrinsic = SubmittableExtrinsic<'promise'>
