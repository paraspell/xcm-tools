// Implements builder pattern for XCM message creation operations operation

import { type ApiPromise } from '@polkadot/api'
import { send, sendSerializedApiCall } from '../../pallets/xcmPallet'
import { type TSerializedApiCall, type Extrinsic, type TNode, type TSendOptions } from '../../types'
import { getRelayChainSymbol } from '../../pallets/assets'
import { type UseKeepAliveFinalBuilder, type AddressBuilder } from './Builder'

class ParaToRelayBuilder implements AddressBuilder, UseKeepAliveFinalBuilder {
  private readonly api?: ApiPromise
  private readonly from: TNode
  private readonly amount: string | number | bigint

  private _address: string
  private _destApi?: ApiPromise

  private constructor(api: ApiPromise | undefined, from: TNode, amount: string | number | bigint) {
    this.api = api
    this.from = from
    this.amount = amount
  }

  static create(
    api: ApiPromise | undefined,
    from: TNode,
    amount: string | number | bigint
  ): AddressBuilder {
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

  private buildOptions(): TSendOptions {
    const currency = getRelayChainSymbol(this.from)
    return {
      api: this.api,
      origin: this.from,
      currency,
      amount: this.amount,
      address: this._address,
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

export default ParaToRelayBuilder
