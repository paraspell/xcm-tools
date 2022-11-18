//  derrived from https://github.com/kodadot/packages/blob/main/minimark/src/common/types.ts

import { SubmittableExtrinsic } from '@polkadot/api/types'
import { nodeNames } from './maps/consts'

export type UpdateFunction = (name: string, index: number) => string
export type Extrinsic = SubmittableExtrinsic<'promise'>
export type ExtrinsicFunction<T> = (arg: T) => Extrinsic
export type TPalletType = 'xTokens' | 'polkadotXCM' | 'ormlXTokens' | 'relayerXcm'
export type TRelayChainType = 'polkadot' | 'kusama'
export type TNodeDetails = {
    name: string,
    type: TRelayChainType
}
export type TNode = typeof nodeNames[number];
