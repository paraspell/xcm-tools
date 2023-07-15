// Implements builder pattern for Close HRMP channel operation

import { ApiPromise } from '@polkadot/api'
import { TNode } from '../../../types'
import { closeChannel, closeChannelSerializedApiCall } from '../../hrmp'
import { FinalBuilder } from './Builder'

export interface OutboundCloseChannelBuilder {
  outbound(inbound: number): FinalBuilder
}

export interface InboundCloseChannelBuilder {
  inbound(inbound: number): OutboundCloseChannelBuilder
}

class CloseChannelBuilder
  implements InboundCloseChannelBuilder, OutboundCloseChannelBuilder, FinalBuilder
{
  private api: ApiPromise
  private from: TNode

  private _inbound: number
  private _outbound: number

  private constructor(api: ApiPromise, from: TNode) {
    this.api = api
    this.from = from
  }

  static create(api: ApiPromise, from: TNode): InboundCloseChannelBuilder {
    return new CloseChannelBuilder(api, from)
  }

  inbound(inbound: number) {
    this._inbound = inbound
    return this
  }

  outbound(outbound: number) {
    this._outbound = outbound
    return this
  }

  build() {
    return closeChannel(this.api, this.from, this._inbound, this._outbound)
  }

  buildSerializedApiCall() {
    return closeChannelSerializedApiCall(this.api, this.from, this._inbound, this._outbound)
  }
}

export default CloseChannelBuilder
