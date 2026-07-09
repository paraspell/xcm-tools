import type { ApiPromise } from '@polkadot/api'
import type { Signer as PjsSigner } from '@polkadot/api/types'
import { type SubmittableExtrinsic } from '@polkadot/api/types'

export type TPjsApi = ApiPromise
export type Extrinsic = SubmittableExtrinsic<'promise'>
export type TPjsSigner = { signer: PjsSigner; address: string }
