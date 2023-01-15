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

export interface CurrencyIdSendBuilder {
  currencyId(currencyId: number): AmountSendBuilder
}

class SendBuilder implements CurrencyIdSendBuilder, AmountSendBuilder, AddressSendBuilder, FinalRelayToParaBuilder {
  private api: ApiPromise
  private from: TNode
  private to: TNode | undefined
  private currency: string

  private _currencyId: number
  private _amount: any
  private _address: string

  private constructor(api: ApiPromise, from: TNode, to: TNode | undefined, currency: string) {
    this.api = api
    this.from = from
    this.to = to
    this.currency = currency
  }

  static createParaToRelay(api: ApiPromise, from: TNode, currency: string): CurrencyIdSendBuilder {
    return new SendBuilder(api, from, undefined, currency)
  }

  static createParaToPara(api: ApiPromise, from: TNode, to: TNode, currency: string): CurrencyIdSendBuilder {
    return new SendBuilder(api, from, to, currency)
  }

  currencyId(currencyId: number) {
    this._currencyId = currencyId
    return this
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
    return send(this.api, this.from, this.currency, this._currencyId, this._amount, this._address, this.to)
  }
}

export default SendBuilder
