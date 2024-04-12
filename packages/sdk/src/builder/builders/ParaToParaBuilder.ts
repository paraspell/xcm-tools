// Implements builder pattern for XCM message creation operations operation

import { type ApiPromise } from '@polkadot/api'
import { send, sendSerializedApiCall } from '../../pallets/xcmPallet'
import {
  type TSerializedApiCall,
  type Extrinsic,
  type TNode,
  type TSendOptions,
  type TCurrency,
  type TAmount,
  type TAddress,
  type TDestination
} from '../../types'
import { type UseKeepAliveFinalBuilder, type AddressBuilder, type AmountBuilder } from './Builder'

class ParaToParaBuilder implements AmountBuilder, AddressBuilder, UseKeepAliveFinalBuilder {
  private readonly api?: ApiPromise
  private readonly from: TNode
  private readonly to: TDestination
  private readonly currency: TCurrency
  private readonly paraIdTo?: number

  private _amount: TAmount
  private _address: TAddress
  private _destApi?: ApiPromise

  private constructor(
    api: ApiPromise | undefined,
    from: TNode,
    to: TDestination,
    currency: TCurrency,
    paraIdTo?: number
  ) {
    this.api = api
    this.from = from
    this.to = to
    this.currency = currency
    this.paraIdTo = paraIdTo
  }

  static createParaToPara(
    api: ApiPromise | undefined,
    from: TNode,
    to: TDestination,
    currency: TCurrency,
    paraIdTo?: number
  ): AmountBuilder {
    return new ParaToParaBuilder(api, from, to, currency, paraIdTo)
  }

  amount(amount: TAmount): this {
    this._amount = amount
    return this
  }

  address(address: TAddress): this {
    this._address = address
    return this
  }

  useKeepAlive(destApi: ApiPromise): this {
    this._destApi = destApi
    return this
  }

  private buildOptions(): TSendOptions {
    return {
      api: this.api,
      origin: this.from,
      currency: this.currency,
      amount: this._amount,
      address: this._address,
      destination: this.to,
      paraIdTo: this.paraIdTo,
      destApiForKeepAlive: this._destApi
    }
  }

  async build(): Promise<Extrinsic> {
    const options = this.buildOptions()
    return await send(options)
  }

  async buildSerializedApiCall(): Promise<TSerializedApiCall> {
    const options = this.buildOptions()
    return await sendSerializedApiCall(options)
  }
}

export default ParaToParaBuilder
