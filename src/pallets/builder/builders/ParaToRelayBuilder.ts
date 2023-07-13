// Implements builder pattern for XCM message creation operations operation

import { ApiPromise } from '@polkadot/api'
import { send, sendSerializedApiCall } from '../../xcmPallet'
import { TNode } from '../../../types'
import { getRelayChainSymbol } from '../../assets'
import { AddressBuilder, FinalBuilder } from './Builder'

class ParaToRelayBuilder implements AddressBuilder, FinalBuilder {
  private api: ApiPromise
  private from: TNode
  private amount: any

  private _address: string

  private constructor(api: ApiPromise, from: TNode, amount: any) {
    this.api = api
    this.from = from
    this.amount = amount
  }

  static create(api: ApiPromise, from: TNode, amount: any): AddressBuilder {
    return new ParaToRelayBuilder(api, from, amount)
  }

  address(address: string) {
    this._address = address
    return this
  }

  build() {
    const currency = getRelayChainSymbol(this.from)
    return send(this.api, this.from, currency, this.amount, this._address)
  }

  buildSerializedApiCall() {
    const currency = getRelayChainSymbol(this.from)
    return sendSerializedApiCall(this.api, this.from, currency, this.amount, this._address)
  }
}

export default ParaToRelayBuilder
