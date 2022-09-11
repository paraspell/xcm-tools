//derrived from https://github.com/kodadot/packages/blob/main/minimark/src/common/types.ts

import { SubmittableExtrinsic } from '@polkadot/api/types'

export type UpdateFunction = (name: string, index: number) => string
export type ExtrinsicFunction<T> = (arg: T) => Extrinsic

export type DisplayType = null | 'boost_number' | 'number' | 'boost_percentage'

export type Attribute = {
  display_type?: DisplayType
  trait_type?: string
  value: number | string
}

export type Metadata = {
  name: string
  description: string
  image: string
  animation_url?: string
  attributes?: Attribute[]
  external_url?: string
  type: string
}

export type Extrinsic = SubmittableExtrinsic<'promise'>