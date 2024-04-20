import { type ApiPromise } from '@polkadot/api'
import { type TNode } from './TNode'

export interface TOpenChannelOptions {
  api: ApiPromise
  origin: TNode
  destination: TNode
  maxSize: number
  maxMessageSize: number
}

export interface TCloseChannelOptions {
  api: ApiPromise
  origin: TNode
  inbound: number
  outbound: number
}

export interface TCloseChannelInternalOptions extends TCloseChannelOptions {
  serializedApiCallEnabled?: boolean
}

export interface TOpenChannelInternalOptions extends TOpenChannelOptions {
  serializedApiCallEnabled?: boolean
}
