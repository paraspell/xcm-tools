// Implements builder pattern for XCM message creation operations operation

import { type ApiPromise } from '@polkadot/api'
import { send, sendSerializedApiCall } from '../../pallets/xcmPallet'
import { type TSerializedApiCall, type Extrinsic, type TNode } from '../../types'
import { getRelayChainSymbol } from '../../pallets/assets'
import { type UseKeepAliveFinalBuilder, type AddressBuilder } from './Builder'

class ParaToRelayBuilder implements AddressBuilder, UseKeepAliveFinalBuilder {
  private readonly api: ApiPromise
  private readonly from: TNode
  private readonly amount: string | number | bigint

  private _address: string
  private _destApi?: ApiPromise

  private constructor(api: ApiPromise, from: TNode, amount: string | number | bigint) {
    this.api = api
    this.from = from
    this.amount = amount
  }

  static create(api: ApiPromise, from: TNode, amount: string | number | bigint): AddressBuilder {
    return new ParaToRelayBuilder(api, from, amount)
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
    const currency = getRelayChainSymbol(this.from)
    return await send(
      this.api,
      this.from,
      currency,
      this.amount,
      this._address,
      undefined,
      undefined,
      this._destApi
    )
  }

  async buildSerializedApiCall(): Promise<TSerializedApiCall> {
    const currency = getRelayChainSymbol(this.from)
    return await sendSerializedApiCall(
      this.api,
      this.from,
      currency,
      this.amount,
      this._address,
      undefined,
      undefined,
      this._destApi
    )
  }
}

export default ParaToRelayBuilder
