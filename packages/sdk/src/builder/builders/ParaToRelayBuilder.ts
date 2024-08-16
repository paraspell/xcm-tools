// Implements builder pattern for XCM message creation operations operation

import { type ApiPromise } from '@polkadot/api'
import { send, sendSerializedApiCall } from '../../pallets/xcmPallet'
import {
  type TSerializedApiCall,
  type Extrinsic,
  type TNode,
  type TSendOptions,
  type TAmount,
  type TAddress,
  type TCurrency,
  type Version
} from '../../types'
import { getRelayChainSymbol } from '../../pallets/assets'
import { type UseKeepAliveFinalBuilder, type AddressBuilder, GeneralBuilder } from './Builder'
import BatchTransactionManager from './BatchTransactionManager'

class ParaToRelayBuilder implements AddressBuilder, UseKeepAliveFinalBuilder {
  private readonly api?: ApiPromise
  private readonly from: TNode
  private readonly amount: TAmount | null
  private readonly feeAsset?: TCurrency

  private _address: TAddress
  private _destApi?: ApiPromise
  private _version?: Version

  private constructor(
    api: ApiPromise | undefined,
    from: TNode,
    amount: TAmount | null,
    private batchManager: BatchTransactionManager,
    feeAsset?: TCurrency
  ) {
    this.api = api
    this.from = from
    this.amount = amount
    this.feeAsset = feeAsset
  }

  static create(
    api: ApiPromise | undefined,
    from: TNode,
    amount: TAmount | null,
    batchManager: BatchTransactionManager,
    feeAsset?: TCurrency
  ): AddressBuilder {
    return new ParaToRelayBuilder(api, from, amount, batchManager, feeAsset)
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
    if (this.amount === null) {
      throw new Error('Amount is required')
    }
    const currency = getRelayChainSymbol(this.from)
    return {
      api: this.api,
      origin: this.from,
      currency,
      amount: this.amount,
      address: this._address,
      feeAsset: this.feeAsset,
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
