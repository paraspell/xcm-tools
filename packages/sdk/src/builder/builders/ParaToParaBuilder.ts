// Implements builder pattern for XCM message creation operations operation

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
  Version,
  TApiType,
  TResType
} from '../../types'
import type { AddressBuilder, UseKeepAliveFinalBuilder } from './Builder'
import { GeneralBuilder, type AmountBuilder, type AmountOrFeeAssetBuilder } from './Builder'
import type BatchTransactionManager from './BatchTransactionManager'

/**
 * Builder class for constructing transactions between parachains.
 */
class ParaToParaBuilder<TApi extends TApiType, TRes extends TResType>
  implements
    AmountOrFeeAssetBuilder<TApi>,
    AmountBuilder<TApi>,
    AddressBuilder<TApi>,
    UseKeepAliveFinalBuilder<TApi>
{
  private readonly api?: TApi
  private readonly from: TNode
  private readonly to: TDestination
  private readonly currency: TCurrencyInput
  private readonly paraIdTo?: number

  private _feeAsset?: TCurrency
  private _amount: TAmount | null
  private _address: TAddress
  private _destApi?: TApi
  private _version?: Version

  private constructor(
    api: TApi | undefined,
    from: TNode,
    to: TDestination,
    currency: TCurrencyInput,
    private batchManager: BatchTransactionManager<TApi, TRes>,
    paraIdTo?: number
  ) {
    this.api = api
    this.from = from
    this.to = to
    this.currency = currency
    this.paraIdTo = paraIdTo
  }

  static createParaToPara<TApi extends TApiType, TRes extends TResType>(
    api: TApi | undefined,
    from: TNode,
    to: TDestination,
    currency: TCurrencyInput,
    batchManager: BatchTransactionManager<TApi, TRes>,
    paraIdTo?: number
  ): AmountOrFeeAssetBuilder<TApi> {
    return new ParaToParaBuilder(api, from, to, currency, batchManager, paraIdTo)
  }

  /**
   * Specifies the fee asset to be used for the transaction.
   *
   * @param feeAsset - The currency to be used as the fee asset.
   * @returns An instance of Builder
   */
  feeAsset(feeAsset: TCurrency): this {
    this._feeAsset = feeAsset
    return this
  }

  /**
   * Specifies the amount to be transferred. Can be either a number, string, or bigint.
   *
   * @param amount - The amount to transfer.
   * @returns An instance of Builder
   */
  amount(amount: TAmount | null): this {
    this._amount = amount
    return this
  }

  /**
   * Specifies the recipient address.
   *
   * @param address - The destination address.
   * @returns An instance of Builder
   */
  address(address: TAddress): this {
    this._address = address
    return this
  }

  /**
   * Specifies to use the keep-alive option for the destination account.
   *
   * @param destApi - The API instance of the destination chain.
   * @returns An instance of Builder
   */
  useKeepAlive(destApi: TApi): this {
    this._destApi = destApi
    return this
  }

  /**
   * Sets the XCM version to be used for the transfer.
   *
   * @param version - The XCM version.
   * @returns An instance of Builder
   */
  xcmVersion(version: Version): this {
    this._version = version
    return this
  }

  private buildOptions(): TSendOptions<TApi> {
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

  /**
   * Adds the transfer transaction to the batch manager.
   *
   * @returns An instance of Builder
   */
  addToBatch() {
    const options = this.buildOptions()
    this.batchManager.addTransaction({
      func: send,
      options
    })
    return new GeneralBuilder(this.batchManager, this.api, this.from)
  }

  /**
   * Builds and returns the transfer extrinsic.
   *
   * @returns A Promise that resolves to the transfer extrinsic.
   * @throws Error if the batch manager contains batched items.
   */
  async build() {
    if (!this.batchManager.isEmpty()) {
      throw new Error(
        'Transaction manager contains batched items. Use buildBatch() to process them.'
      )
    }
    const options = this.buildOptions()
    return await send(options)
  }

  /**
   * Builds and returns a serialized API call for the transfer.
   *
   * @returns A Promise that resolves to the serialized API call.
   */
  async buildSerializedApiCall(): Promise<TSerializedApiCall> {
    const options = this.buildOptions()
    return await sendSerializedApiCall(options)
  }
}

export default ParaToParaBuilder
