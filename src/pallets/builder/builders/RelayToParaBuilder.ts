// Implements builder pattern for Relay chain to Parachain transfer operation

import { type ApiPromise } from '@polkadot/api'
import { transferRelayToPara, transferRelayToParaSerializedApiCall } from '../../xcmPallet'
import { type TSerializedApiCall, type Extrinsic, type TNode } from '../../../types'
import { type AddressBuilder, type AmountBuilder, type FinalBuilder } from './Builder'

class RelayToParaBuilder implements AmountBuilder, AddressBuilder, FinalBuilder {
  private readonly api: ApiPromise
  private readonly to: TNode

  private _amount: number
  private _address: string

  private constructor(api: ApiPromise, to: TNode) {
    this.api = api
    this.to = to
  }

  static create(api: ApiPromise, to: TNode): AmountBuilder {
    return new RelayToParaBuilder(api, to)
  }

  amount(amount: number): this {
    this._amount = amount
    return this
  }

  address(address: string): this {
    this._address = address
    return this
  }

  build(): Extrinsic | never {
    return transferRelayToPara(this.api, this.to, this._amount, this._address)
  }

  buildSerializedApiCall(): TSerializedApiCall {
    return transferRelayToParaSerializedApiCall(this.api, this.to, this._amount, this._address)
  }
}

export default RelayToParaBuilder
