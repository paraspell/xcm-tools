import { ApiPromise } from '@polkadot/api'
import { Extrinsic, TNode } from '../../types'
import { closeChannel } from '../hrmp'

export interface FinalCloseChannelBuilder {
  build(): Extrinsic
}

export interface OutboundCloseChannelBuilder {
  outbound(inbound: number): FinalCloseChannelBuilder
}

export interface InboundCloseChannelBuilder {
  inbound(inbound: number): OutboundCloseChannelBuilder
}

class CloseChannelBuilder implements InboundCloseChannelBuilder, OutboundCloseChannelBuilder, FinalCloseChannelBuilder {
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
}

export default CloseChannelBuilder
