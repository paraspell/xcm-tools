// Implements builder pattern for Open HRMP channel operation

import { type ApiPromise } from '@polkadot/api'
import { type TSerializedApiCall, type Extrinsic, type TNode } from '../../../types'
import { openChannel, openChannelSerializedApiCall } from '../../parasSudoWrapper'
import { type FinalBuilder } from './Builder'

export interface MaxMessageSizeOpenChannelBuilder {
  maxMessageSize: (size: number) => FinalBuilder
}

export interface MaxSizeOpenChannelBuilder {
  maxSize: (size: number) => MaxMessageSizeOpenChannelBuilder
}

class OpenChannelBuilder
  implements MaxSizeOpenChannelBuilder, MaxMessageSizeOpenChannelBuilder, FinalBuilder
{
  private readonly api: ApiPromise
  private readonly from: TNode
  private readonly to: TNode

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

  maxSize(size: number): this {
    this._maxSize = size
    return this
  }

  maxMessageSize(size: number): this {
    this._maxMessageSize = size
    return this
  }

  build(): Extrinsic {
    return openChannel(this.api, this.from, this.to, this._maxSize, this._maxMessageSize)
  }

  buildSerializedApiCall(): TSerializedApiCall {
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
