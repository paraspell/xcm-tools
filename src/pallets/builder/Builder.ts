import { ApiPromise } from '@polkadot/api'
import { TNode } from '../../types'
import CloseChannelBuilder from './CloseChannelBuilder'
import OpenChannelBuilder from './OpenChannelBuilder'
import RelayToParaBuilder from './RelayToParaBuilder'
import SendBuilder from './SendBuilder'

class ToGeneralBuilder {
  private api: ApiPromise
  private from: TNode
  private to: TNode

  constructor(api: ApiPromise, from: TNode, to: TNode) {
    this.api = api
    this.from = from
    this.to = to
  }

  currency(currency: string) {
    return SendBuilder.createParaToPara(this.api, this.from, this.to, currency)
  }

  openChannel() {
    return OpenChannelBuilder.create(this.api, this.from, this.to)
  }
}

class FromGeneralBuilder {
  private api: ApiPromise
  private from: TNode

  constructor(api: ApiPromise, from: TNode) {
    this.api = api
    this.from = from
  }

  to(node: TNode) {
    return new ToGeneralBuilder(this.api, this.from, node)
  }

  currency(currency: string) {
    return SendBuilder.createParaToRelay(this.api, this.from, currency)
  }

  closeChannel() {
    return CloseChannelBuilder.create(this.api, this.from)
  }
}

class GeneralBuilder {
  private api: ApiPromise

  constructor(api: ApiPromise) {
    this.api = api
  }

  from(node: TNode) {
    return new FromGeneralBuilder(this.api, node)
  }

  to(node: TNode) {
    return RelayToParaBuilder.create(this.api, node)
  }
}

export function Builder(api: ApiPromise) {
  return new GeneralBuilder(api)
}
