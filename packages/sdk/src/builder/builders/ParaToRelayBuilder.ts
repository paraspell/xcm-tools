// Implements builder pattern for XCM message creation operations operation

import { type ApiPromise } from '@polkadot/api'
import { send, sendSerializedApiCall } from '../../pallets/xcmPallet'
import {
  type TSerializedApiCall,
  type Extrinsic,
  type TNode,
  type TSendOptions,
  type TAmount,
  type TAddress
} from '../../types'
import { getRelayChainSymbol } from '../../pallets/assets'
import { type UseKeepAliveFinalBuilder, type AddressBuilder } from './Builder'

class ParaToRelayBuilder implements AddressBuilder, UseKeepAliveFinalBuilder {
  private readonly api?: ApiPromise
  private readonly from: TNode
  private readonly amount: TAmount

  private _address: TAddress
  private _destApi?: ApiPromise

  private constructor(api: ApiPromise | undefined, from: TNode, amount: TAmount) {
    this.api = api
    this.from = from
    this.amount = amount
  }

  static create(api: ApiPromise | undefined, from: TNode, amount: TAmount): AddressBuilder {
    return new ParaToRelayBuilder(api, from, amount)
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
