// Implements builder pattern for Relay chain to Parachain transfer operation

import { type ApiPromise } from '@polkadot/api'
import { transferRelayToPara, transferRelayToParaSerializedApiCall } from '../../xcmPallet'
import { type TSerializedApiCall, type Extrinsic, type TNode } from '../../../types'
import { type UseKeepAliveFinalBuilder, type AddressBuilder, type AmountBuilder } from './Builder'

class RelayToParaBuilder implements AmountBuilder, AddressBuilder, UseKeepAliveFinalBuilder {
  private readonly api: ApiPromise
  private readonly to: TNode
  private readonly paraIdTo?: number

  private _amount: number
  private _address: string
  private _destApi?: ApiPromise

  private constructor(api: ApiPromise, to: TNode, paraIdTo?: number) {
    this.api = api
    this.to = to
    this.paraIdTo = paraIdTo
  }

  static create(api: ApiPromise, to: TNode, paraIdTo?: number): AmountBuilder {
    return new RelayToParaBuilder(api, to, paraIdTo)
  }

  amount(amount: number): this {
    this._amount = amount
    return this
  }

  address(address: string): this {
    this._address = address
    return this
  }

  useKeepAlive(destApi: ApiPromise): this {
    this._destApi = destApi
    return this
  }

  async build(): Promise<Extrinsic | never> {
    return await transferRelayToPara(
      this.api,
      this.to,
      this._amount,
      this._address,
      this.paraIdTo,
      this._destApi
    )
  }

  async buildSerializedApiCall(): Promise<TSerializedApiCall> {
    return await transferRelayToParaSerializedApiCall(
      this.api,
      this.to,
      this._amount,
      this._address,
      this.paraIdTo,
      this._destApi
    )
  }
}

export default RelayToParaBuilder
