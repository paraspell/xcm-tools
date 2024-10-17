// Implements builder pattern for XCM message creation operations operation

import { send, sendSerializedApiCall } from '../../pallets/xcmPallet/transfer'
import type {
  TSerializedApiCall,
  TNode,
  TSendOptions,
  TAmount,
  TAddress,
  TCurrency,
  Version
} from '../../types'
import { getRelayChainSymbol } from '../../pallets/assets'
import { type UseKeepAliveFinalBuilder, type AddressBuilder, GeneralBuilder } from './Builder'
import type BatchTransactionManager from './BatchTransactionManager'
import type { IPolkadotApi } from '../../api/IPolkadotApi'

class ParaToRelayBuilder<TApi, TRes>
  implements AddressBuilder<TApi, TRes>, UseKeepAliveFinalBuilder<TApi, TRes>
{
  private readonly api: IPolkadotApi<TApi, TRes>
  private readonly from: TNode
  private readonly amount: TAmount | null
  private readonly feeAsset?: TCurrency

  private _address: TAddress
  private _destApi: IPolkadotApi<TApi, TRes>
  private _version?: Version

  private constructor(
    api: IPolkadotApi<TApi, TRes>,
    from: TNode,
    amount: TAmount | null,
    private batchManager: BatchTransactionManager<TApi, TRes>,
    feeAsset?: TCurrency
  ) {
    this.api = api
    this.from = from
    this.amount = amount
    this.feeAsset = feeAsset
    this._destApi = api.clone()
  }

  static create<TApi, TRes>(
    api: IPolkadotApi<TApi, TRes>,
    from: TNode,
    amount: TAmount | null,
    batchManager: BatchTransactionManager<TApi, TRes>,
    feeAsset?: TCurrency
  ): AddressBuilder<TApi, TRes> {
    return new ParaToRelayBuilder(api, from, amount, batchManager, feeAsset)
  }

  address(address: TAddress): this {
    this._address = address
    return this
  }

  useKeepAlive(destApi: TApi): this {
    this._destApi.setApi(destApi)
    return this
  }

  xcmVersion(version: Version): this {
    this._version = version
    return this
  }

  private buildOptions(): TSendOptions<TApi, TRes> {
    if (this.amount === null) {
      throw new Error('Amount is required')
    }
    const currency = getRelayChainSymbol(this.from)
    return {
      api: this.api,
      origin: this.from,
      currency: {
        symbol: currency
      },
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

  async build() {
    const options = this.buildOptions()
    return await send<TApi, TRes>(options)
  }

  async buildSerializedApiCall(): Promise<TSerializedApiCall> {
    const options = this.buildOptions()
    return await sendSerializedApiCall(options)
  }
}

export default ParaToRelayBuilder
