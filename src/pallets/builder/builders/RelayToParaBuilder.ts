// Implements builder pattern for Relay chain to Parachain transfer operation

import { ApiPromise } from '@polkadot/api'
import { transferRelayToPara, transferRelayToParaSerializedApiCall } from '../../xcmPallet'
import { TNode } from '../../../types'
import { AddressBuilder, AmountBuilder, FinalBuilder } from './Builder'

class RelayToParaBuilder implements AmountBuilder, AddressBuilder, FinalBuilder {
  private api: ApiPromise
  private to: TNode

  private _amount: number
  private _address: string

  private constructor(api: ApiPromise, to: TNode) {
    this.api = api
    this.to = to
  }

  static create(api: ApiPromise, to: TNode): AmountBuilder {
    return new RelayToParaBuilder(api, to)
  }

  amount(amount: number) {
    this._amount = amount
    return this
  }

  address(address: string) {
    this._address = address
    return this
  }

  build() {
    return transferRelayToPara(this.api, this.to, this._amount, this._address)
  }

  buildSerializedApiCall() {
    return transferRelayToParaSerializedApiCall(this.api, this.to, this._amount, this._address)
  }
}

export default RelayToParaBuilder
