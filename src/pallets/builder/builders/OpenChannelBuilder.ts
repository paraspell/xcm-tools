// Implements builder pattern for Open HRMP channel operation

import { ApiPromise } from '@polkadot/api'
import { TNode } from '../../../types'
import { openChannel, openChannelSerializedApiCall } from '../../parasSudoWrapper'
import { FinalBuilder } from './Builder'

export interface MaxMessageSizeOpenChannelBuilder {
  maxMessageSize(size: number): FinalBuilder
}

export interface MaxSizeOpenChannelBuilder {
  maxSize(size: number): MaxMessageSizeOpenChannelBuilder
}

class OpenChannelBuilder
  implements MaxSizeOpenChannelBuilder, MaxMessageSizeOpenChannelBuilder, FinalBuilder
{
  private api: ApiPromise
  private from: TNode
  private to: TNode

  private _maxSize: number
  private _maxMessageSize: number

  private constructor(api: ApiPromise, from: TNode, to: TNode) {
    this.api = api
    this.from = from
    this.to = to
  }

  static create(api: ApiPromise, from: TNode, to: TNode): MaxSizeOpenChannelBuilder {
    return new OpenChannelBuilder(api, from, to)
  }

  maxSize(size: number) {
    this._maxSize = size
    return this
  }

  maxMessageSize(size: number) {
    this._maxMessageSize = size
    return this
  }

  build() {
    return openChannel(this.api, this.from, this.to, this._maxSize, this._maxMessageSize)
  }

  buildSerializedApiCall() {
    return openChannelSerializedApiCall(
      this.api,
      this.from,
      this.to,
      this._maxSize,
      this._maxMessageSize
    )
  }
}

export default OpenChannelBuilder
