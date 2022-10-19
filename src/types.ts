//  derrived from https://github.com/kodadot/packages/blob/main/minimark/src/common/types.ts

import { SubmittableExtrinsic } from '@polkadot/api/types'

export type UpdateFunction = (name: string, index: number) => string
export type Extrinsic = SubmittableExtrinsic<'promise'>
export type ExtrinsicFunction<T> = (arg: T) => Extrinsic
