// Implements builder pattern for Relay chain to Parachain transfer operation

import { transferRelayToPara, transferRelayToParaSerializedApiCall } from '../../pallets/xcmPallet'
import type { TApiType, TResType } from '../../types'
import {
  type TSerializedApiCall,
  type TRelayToParaOptions,
  type TDestination,
  type TAddress,
  type Version
} from '../../types'
import {
  type UseKeepAliveFinalBuilder,
  type AddressBuilder,
  type AmountBuilder,
  GeneralBuilder
} from './Builder'
import type BatchTransactionManager from './BatchTransactionManager'

/**
 * Builder class for constructing transfer operations from the Relay chain to a Parachain.
 */
class RelayToParaBuilder<TApi extends TApiType, TRes extends TResType>
  implements AmountBuilder<TApi>, AddressBuilder<TApi>, UseKeepAliveFinalBuilder<TApi>
{
  private readonly api?: TApi
  private readonly to: TDestination
  private readonly paraIdTo?: number

  private _amount: number
  private _address: TAddress
  private _destApi?: TApi
  private _version?: Version

  private constructor(
    api: TApi | undefined,
    to: TDestination,
    private batchManager: BatchTransactionManager<TApi, TRes>,
    paraIdTo?: number
  ) {
    this.api = api
    this.to = to
    this.paraIdTo = paraIdTo
  }

  static create<TApi extends TApiType, TRes extends TResType>(
    api: TApi | undefined,
    to: TDestination,
    batchManager: BatchTransactionManager<TApi, TRes>,
    paraIdTo?: number
  ): AmountBuilder<TApi> {
    return new RelayToParaBuilder(api, to, batchManager, paraIdTo)
  }

  /**
   * Sets the amount to be transferred.
   *
   * @param amount - The amount to transfer.
   * @returns An instance of Builder
   */
  amount(amount: number): this {
    this._amount = amount
    return this
  }

  /**
   * Sets the recipient address.
   *
   * @param address - The destination address.
   * @returns An instance of Builder
   */
  address(address: TAddress): this {
    this._address = address
    return this
  }

  /**
   * Specifies to use the keep-alive option for the destination account to keep account active.
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

  private buildOptions(): TRelayToParaOptions<TApi> {
    return {
      api: this.api,
      destination: this.to,
      amount: this._amount,
      address: this._address,
      paraIdTo: this.paraIdTo,
      destApiForKeepAlive: this._destApi,
      version: this._version
    }
  }

  /**
   * Adds the transfer transaction to the batch.
   *
   * @returns An instance of Builder
   */
  addToBatch() {
    this.batchManager.addTransaction({
      func: transferRelayToPara,
      options: this.buildOptions()
    })
    return new GeneralBuilder(this.batchManager, this.api, undefined, this.to)
  }

  /**
   * Builds and returns the transfer extrinsic.
   *
   * @returns A Promise that resolves to the transfer extrinsic.
   */
  async build() {
    const options = this.buildOptions()
    return await transferRelayToPara(options)
  }

  /**
   * Builds and returns a serialized API call for the transfer.
   *
   * @returns A Promise that resolves to the serialized API call.
   */
  async buildSerializedApiCall(): Promise<TSerializedApiCall> {
    const options = this.buildOptions()
    return await transferRelayToParaSerializedApiCall(options)
  }
}

export default RelayToParaBuilder
