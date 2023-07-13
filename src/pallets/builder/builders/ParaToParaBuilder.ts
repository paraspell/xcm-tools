// Implements builder pattern for XCM message creation operations operation

import { ApiPromise } from '@polkadot/api'
import { send, sendSerializedApiCall } from '../../xcmPallet'
import { TNode } from '../../../types'
import { AddressBuilder, AmountBuilder, FinalBuilder } from './Builder'

class ParaToParaBuilder implements AmountBuilder, AddressBuilder, FinalBuilder {
  private api: ApiPromise
  private from: TNode
  private to: TNode
  private currency: string | number | bigint

  private _amount: any
  private _address: string

  private constructor(api: ApiPromise, from: TNode, to: TNode, currency: string | number | bigint) {
    this.api = api
    this.from = from
    this.to = to
    this.currency = currency
  }

  static createParaToPara(
    api: ApiPromise,
    from: TNode,
    to: TNode,
    currency: string | number | bigint
  ): AmountBuilder {
    return new ParaToParaBuilder(api, from, to, currency)
  }

  amount(amount: any) {
    this._amount = amount
    return this
  }

  address(address: string) {
    this._address = address
    return this
  }

  build() {
    return send(this.api, this.from, this.currency, this._amount, this._address, this.to)
  }

  buildSerializedApiCall() {
    return sendSerializedApiCall(
      this.api,
      this.from,
      this.currency,
      this._amount,
      this._address,
      this.to
    )
  }
}

export default ParaToParaBuilder
