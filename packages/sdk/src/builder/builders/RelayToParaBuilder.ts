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

  amount(amount: number): this {
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

  addToBatch() {
    this.batchManager.addTransaction({
      func: transferRelayToPara,
      options: this.buildOptions()
    })
    return new GeneralBuilder(this.batchManager, this.api, undefined, this.to)
  }

  async build(): Promise<Extrinsic> {
    const options = this.buildOptions()
    return await transferRelayToPara(options)
  }

  async buildSerializedApiCall(): Promise<TSerializedApiCall> {
    const options = this.buildOptions()
    return await transferRelayToParaSerializedApiCall(options)
  }
}

export default RelayToParaBuilder
