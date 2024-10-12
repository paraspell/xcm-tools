// Implements builder pattern for Relay chain to Parachain transfer operation

import { type ApiPromise } from '@polkadot/api'
import { transferRelayToPara, transferRelayToParaSerializedApiCall } from '../../pallets/xcmPallet'
import {
  type TSerializedApiCall,
  type Extrinsic,
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
class RelayToParaBuilder implements AmountBuilder, AddressBuilder, UseKeepAliveFinalBuilder {
  private readonly api?: ApiPromise
  private readonly to: TDestination
  private readonly paraIdTo?: number

  private _amount: number
  private _address: TAddress
  private _destApi?: ApiPromise
  private _version?: Version

  private constructor(
    api: ApiPromise | undefined,
    to: TDestination,
    private batchManager: BatchTransactionManager,
    paraIdTo?: number
  ) {
    this.api = api
    this.to = to
    this.paraIdTo = paraIdTo
  }

  static create(
    api: ApiPromise | undefined,
    to: TDestination,
    batchManager: BatchTransactionManager,
    paraIdTo?: number
  ): AmountBuilder {
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
  useKeepAlive(destApi: ApiPromise): this {
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

  private buildOptions(): TRelayToParaOptions {
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
  async build(): Promise<Extrinsic> {
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
