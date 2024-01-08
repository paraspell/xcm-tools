// Implements builder pattern for XCM message creation operations operation

import { type ApiPromise } from '@polkadot/api'
import { send, sendSerializedApiCall } from '../../xcmPallet'
import { type TSerializedApiCall, type Extrinsic, type TNode } from '../../../types'
import { type UseKeepAliveFinalBuilder, type AddressBuilder, type AmountBuilder } from './Builder'

class ParaToParaBuilder implements AmountBuilder, AddressBuilder, UseKeepAliveFinalBuilder {
  private readonly api: ApiPromise
  private readonly from: TNode
  private readonly to: TNode
  private readonly currency: string | number | bigint
  private readonly paraIdTo?: number

  private _amount: string | number | bigint
  private _address: string
  private _destApi?: ApiPromise

  private constructor(
    api: ApiPromise,
    from: TNode,
    to: TNode,
    currency: string | number | bigint,
    paraIdTo?: number
  ) {
    this.api = api
    this.from = from
    this.to = to
    this.currency = currency
    this.paraIdTo = paraIdTo
  }

  static createParaToPara(
    api: ApiPromise,
    from: TNode,
    to: TNode,
    currency: string | number | bigint,
    paraIdTo?: number
  ): AmountBuilder {
    return new ParaToParaBuilder(api, from, to, currency, paraIdTo)
  }

  amount(amount: string | number | bigint): this {
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

  async build(): Promise<Extrinsic> {
    return await send(
      this.api,
      this.from,
      this.currency,
      this._amount,
      this._address,
      this.to,
      this.paraIdTo,
      this._destApi
    )
  }

  async buildSerializedApiCall(): Promise<TSerializedApiCall> {
    return await sendSerializedApiCall(
      this.api,
      this.from,
      this.currency,
      this._amount,
      this._address,
      this.to,
      this.paraIdTo,
      this._destApi
    )
  }
}

export default ParaToParaBuilder
