// Implements general builder pattern, this is Builder main file

import { ApiPromise } from '@polkadot/api'
import { TNode } from '../../../types'
import AddLiquidityBuilder from './AddLiquidityBuilder'
import BuyBuilder from './BuyBuilder'
import CloseChannelBuilder from './CloseChannelBuilder'
import CreatePoolBuilder from './CreatePoolBuilder'
import OpenChannelBuilder from './OpenChannelBuilder'
import RelayToParaBuilder from './RelayToParaBuilder'
import RemoveLiquidityBuilder from './RemoveLiquidityBuilder'
import SellBuilder from './SellBuilder'
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

  currency(currency: string | number | bigint) {
    return SendBuilder.createParaToPara(this.api, this.from, this.to, currency)
  }

  openChannel() {
    return OpenChannelBuilder.create(this.api, this.from, this.to)
  }
}

class FromGeneralBuilder {
  private api: ApiPromise
  private from: TNode
  private version: number

  constructor(api: ApiPromise, from: TNode, version: number) {
    this.api = api
    this.from = from
    this.version = version
  }

  to(node: TNode) {
    return new ToGeneralBuilder(this.api, this.from, node)
  }

  currency(currency: string | number | bigint) {
    return SendBuilder.createParaToRelay(this.api, this.from, currency)
  }

  closeChannel() {
    return CloseChannelBuilder.create(this.api, this.from)
  }
}

class GeneralBuilder {
  private api: ApiPromise
  private version: number

  constructor(api: ApiPromise) {
    this.api = api
  }

  from(node: TNode) {
    return new FromGeneralBuilder(this.api, node, this.version)
  }

  to(node: TNode) {
    return RelayToParaBuilder.create(this.api, node)
  }

  addLiquidity() {
    return AddLiquidityBuilder.create(this.api)
  }

  removeLiquidity() {
    return RemoveLiquidityBuilder.create(this.api)
  }

  buy() {
    return BuyBuilder.create(this.api)
  }

  sell() {
    return SellBuilder.create(this.api)
  }

  createPool() {
    return CreatePoolBuilder.create(this.api)
  }
}

export function Builder(api: ApiPromise) {
  return new GeneralBuilder(api)
}
