// Implements builder pattern for XCM message creation operations operation

import { type ApiPromise } from '@polkadot/api'
import { send, sendSerializedApiCall } from '../../xcmPallet'
import { type TSerializedApiCall, type Extrinsic, type TNode } from '../../../types'
import { type AddressBuilder, type AmountBuilder, type FinalBuilder } from './Builder'

class ParaToParaBuilder implements AmountBuilder, AddressBuilder, FinalBuilder {
  private readonly api: ApiPromise
  private readonly from: TNode
  private readonly to: TNode
  private readonly currency: string | number | bigint

  private _amount: string | number | bigint
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

  amount(amount: string | number | bigint): this {
    this._amount = amount
    return this
  }

  address(address: string): this {
    this._address = address
    return this
  }

  build(): Extrinsic {
    return send(this.api, this.from, this.currency, this._amount, this._address, this.to)
  }

  buildSerializedApiCall(): TSerializedApiCall {
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
