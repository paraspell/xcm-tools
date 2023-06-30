// Implements builder pattern for XCM message creation operations operation

import { ApiPromise } from '@polkadot/api'
import { send } from '../../xcmPallet'
import { Extrinsic, TNode } from '../../../types'

export interface FinalRelayToParaBuilder {
  build(): Extrinsic | never
}

export interface AddressSendBuilder {
  address(address: string): FinalRelayToParaBuilder
}

export interface AmountSendBuilder {
  amount(amount: any): AddressSendBuilder
}

class SendBuilder implements AmountSendBuilder, AddressSendBuilder, FinalRelayToParaBuilder {
  private api: ApiPromise
  private from: TNode
  private to: TNode | undefined
  private currency: string | number | bigint
  private version: number

  private _amount: any
  private _address: string

  private constructor(
    api: ApiPromise,
    from: TNode,
    to: TNode | undefined,
    version: number,
    currency: string | number | bigint
  ) {
    this.api = api
    this.from = from
    this.to = to
    this.currency = currency
    this.version = version
  }

  static createParaToRelay(
    api: ApiPromise,
    from: TNode,
    version: number,
    currency: string | number | bigint
  ): AmountSendBuilder {
    return new SendBuilder(api, from, undefined, version, currency)
  }

  static createParaToPara(
    api: ApiPromise,
    from: TNode,
    to: TNode,
    version: number,
    currency: string | number | bigint
  ): AmountSendBuilder {
    return new SendBuilder(api, from, to, version, currency)
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
    return send(this.api, this.from, this.currency, this._amount, this._address, this.version, this.to)
  }
}

export default SendBuilder
