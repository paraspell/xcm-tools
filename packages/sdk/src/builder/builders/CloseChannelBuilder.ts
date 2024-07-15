// Implements builder pattern for Close HRMP channel operation

import { type ApiPromise } from '@polkadot/api'
import {
  type TSerializedApiCall,
  type Extrinsic,
  type TNode,
  type TCloseChannelOptions
} from '../../types'
import { closeChannel, closeChannelSerializedApiCall } from '../../pallets/hrmp'
import { type FinalBuilder } from './Builder'

export interface OutboundCloseChannelBuilder {
  outbound: (inbound: number) => FinalBuilder
}

export interface InboundCloseChannelBuilder {
  inbound: (inbound: number) => OutboundCloseChannelBuilder
}

export class CloseChannelBuilder
  implements InboundCloseChannelBuilder, OutboundCloseChannelBuilder, FinalBuilder
{
  private readonly api: ApiPromise
  private readonly from: TNode

  private _inbound: number
  private _outbound: number

  private constructor(api: ApiPromise, from: TNode) {
    this.api = api
    this.from = from
  }

  static create(api: ApiPromise, from: TNode): InboundCloseChannelBuilder {
    return new CloseChannelBuilder(api, from)
  }

  inbound(inbound: number): this {
    this._inbound = inbound
    return this
  }

  outbound(outbound: number): this {
    this._outbound = outbound
    return this
  }

  private buildOptions(): TCloseChannelOptions {
    return {
      api: this.api,
      origin: this.from,
      inbound: this._inbound,
      outbound: this._outbound
    }
  }

  build(): Extrinsic {
    const options = this.buildOptions()
    return closeChannel(options)
  }

  buildSerializedApiCall(): TSerializedApiCall {
    const options = this.buildOptions()
    return closeChannelSerializedApiCall(options)
  }
}
