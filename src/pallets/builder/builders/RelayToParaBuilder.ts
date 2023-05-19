//Implements builder pattern for Relay chain to Parachain transfer operation 

import { ApiPromise } from '@polkadot/api'
import { transferRelayToPara } from '../../xcmPallet'
import { Extrinsic, TNode } from '../../../types'

export interface FinalRelayToParaBuilder {
  build(): Extrinsic | never
}

export interface AddressRelayToParaBuilder {
  address(address: string): FinalRelayToParaBuilder
}

export interface AmountRelayToParaBuilder {
  amount(amount: number): AddressRelayToParaBuilder
}

class RelayToParaBuilder
  implements AmountRelayToParaBuilder, AddressRelayToParaBuilder, FinalRelayToParaBuilder
{
  private api: ApiPromise
  private to: TNode

  private _amount: number
  private _address: string

  private constructor(api: ApiPromise, to: TNode) {
    this.api = api
    this.to = to
  }

  static create(api: ApiPromise, to: TNode): AmountRelayToParaBuilder {
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
}

export default RelayToParaBuilder
