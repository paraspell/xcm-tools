// Implements builder pattern for XCM message creation operations operation

import type { ApiPromise } from '@polkadot/api'
import { send, sendSerializedApiCall } from '../../pallets/xcmPallet'
import type {
  TSerializedApiCall,
  TNode,
  TSendOptions,
  TCurrencyInput,
  TAmount,
  TAddress,
  TDestination,
  TCurrency,
  Version
} from '../../types'
import type { AddressBuilder, UseKeepAliveFinalBuilder } from './Builder'
import { GeneralBuilder, type AmountBuilder, type AmountOrFeeAssetBuilder } from './Builder'
import type BatchTransactionManager from './BatchTransactionManager'

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
    private batchManager: BatchTransactionManager,
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
    batchManager: BatchTransactionManager,
    paraIdTo?: number
  ): AmountOrFeeAssetBuilder {
    return new ParaToParaBuilder(api, from, to, currency, batchManager, paraIdTo)
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

  addToBatch() {
    const options = this.buildOptions()
    this.batchManager.addTransaction({
      func: send,
      options
    })
    return new GeneralBuilder(this.batchManager, this.api, this.from)
  }

  async build() {
    if (!this.batchManager.isEmpty()) {
      throw new Error(
        'Transaction manager contains batched items. Use buildBatch() to process them.'
      )
    }
    const options = this.buildOptions()
    return await send(options)
  }

  async buildSerializedApiCall(): Promise<TSerializedApiCall> {
    const options = this.buildOptions()
    return await sendSerializedApiCall(options)
  }
}

export default ParaToParaBuilder
