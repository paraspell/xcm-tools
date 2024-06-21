// Implements builder pattern for XCM message creation operations operation

import { type ApiPromise } from '@polkadot/api'
import { send, sendSerializedApiCall } from '../../pallets/xcmPallet'
import {
  type TSerializedApiCall,
  type Extrinsic,
  type TNode,
  type TSendOptions,
  type TCurrencyInput,
  type TAmount,
  type TAddress,
  type TDestination,
  type TCurrency,
  type Version
} from '../../types'
import {
  type UseKeepAliveFinalBuilder,
  type AddressBuilder,
  type AmountBuilder,
  type AmountOrFeeAssetBuilder
} from './Builder'

class ParaToParaBuilder
  implements AmountOrFeeAssetBuilder, AmountBuilder, AddressBuilder, UseKeepAliveFinalBuilder
{
  private readonly api?: ApiPromise
  private readonly from: TNode
  private readonly to: TDestination
  private readonly currency: TCurrencyInput
  private readonly paraIdTo?: number

  private _feeAsset?: TCurrency
  private _amount: TAmount | null
  private _address: TAddress
  private _destApi?: ApiPromise
  private _version?: Version

  private constructor(
    api: ApiPromise | undefined,
    from: TNode,
    to: TDestination,
    currency: TCurrencyInput,
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
    currency: TCurrencyInput,
    paraIdTo?: number
  ): AmountOrFeeAssetBuilder {
    return new ParaToParaBuilder(api, from, to, currency, paraIdTo)
  }

  feeAsset(feeAsset: TCurrency): this {
    this._feeAsset = feeAsset
    return this
  }

  amount(amount: TAmount | null): this {
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

  xcmVersion(version: Version): this {
    this._version = version
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
      feeAsset: this._feeAsset,
      destApiForKeepAlive: this._destApi,
      version: this._version
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
