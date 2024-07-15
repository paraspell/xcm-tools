// Implements builder pattern for Open HRMP channel operation

import { type ApiPromise } from '@polkadot/api'
import {
  type TSerializedApiCall,
  type Extrinsic,
  type TNode,
  type TOpenChannelOptions,
  type TDestination
} from '../../types'
import { openChannel, openChannelSerializedApiCall } from '../../pallets/parasSudoWrapper'
import { type FinalBuilder } from './Builder'

export interface MaxMessageSizeOpenChannelBuilder {
  maxMessageSize: (size: number) => FinalBuilder
}

export interface MaxSizeOpenChannelBuilder {
  maxSize: (size: number) => MaxMessageSizeOpenChannelBuilder
}

export class OpenChannelBuilder
  implements MaxSizeOpenChannelBuilder, MaxMessageSizeOpenChannelBuilder, FinalBuilder
{
  private readonly api: ApiPromise
  private readonly from: TNode
  private readonly to: TDestination

  private _maxSize: number
  private _maxMessageSize: number

  private constructor(api: ApiPromise, from: TNode, to: TDestination) {
    this.api = api
    this.from = from
    this.to = to
  }

  static create(api: ApiPromise, from: TNode, to: TDestination): MaxSizeOpenChannelBuilder {
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

  private buildOptions(): TOpenChannelOptions {
    if (typeof this.to === 'object') {
      throw new Error('Channels do not support multi-location destinations')
    }
    return {
      api: this.api,
      origin: this.from,
      destination: this.to,
      maxSize: this._maxSize,
      maxMessageSize: this._maxMessageSize
    }
  }

  build(): Extrinsic {
    const options = this.buildOptions()
    return openChannel(options)
  }

  buildSerializedApiCall(): TSerializedApiCall {
    const options = this.buildOptions()
    return openChannelSerializedApiCall(options)
  }
}
