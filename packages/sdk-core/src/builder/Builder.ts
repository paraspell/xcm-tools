// Implements general builder pattern, this is Builder main file

import type {
  TDestination,
  TAddress,
  TNodeWithRelayChains,
  Version,
  TBatchOptions,
  TNodeDotKsmWithRelayChains,
  IFromBuilder,
  IToBuilder,
  ICurrencyBuilder,
  IAddressBuilder,
  IFinalBuilderWithOptions,
  IFungibleBuilder,
  TCurrencyInputWithAmount,
  TSendOptions
} from '../types'
import AssetClaimBuilder from './AssetClaimBuilder'
import BatchTransactionManager from './BatchTransactionManager'
import type { IPolkadotApi } from '../api/IPolkadotApi'
import { getDryRun, send } from '../transfer'
import { isRelayChain } from '../utils'
import { isTMultiLocation } from '../pallets/xcmPallet/utils'

/**
 * A builder class for constructing Para-to-Para, Para-to-Relay, Relay-to-Para transactions and asset claims.
 */
export class GeneralBuilder<TApi, TRes>
  implements
    IToBuilder<TApi, TRes>,
    ICurrencyBuilder<TApi, TRes>,
    IAddressBuilder<TApi, TRes>,
    IFinalBuilderWithOptions<TApi, TRes>
{
  private _from: TNodeDotKsmWithRelayChains
  private _to: TDestination
  private _currency: TCurrencyInputWithAmount
  private _paraIdTo?: number
  private _address: TAddress
  private _ahAddress?: string
  private _version?: Version
  private _pallet?: string
  private _method?: string

  constructor(
    private readonly batchManager: BatchTransactionManager<TApi, TRes>,
    private readonly api: IPolkadotApi<TApi, TRes>,
    from?: TNodeDotKsmWithRelayChains
  ) {
    if (from) {
      this._from = from
    }
  }

  /**
   * Specifies the origin node for the transaction.
   *
   * @param node - The node from which the transaction originates.
   * @returns An instance of Builder
   */
  from(node: TNodeDotKsmWithRelayChains) {
    this._from = node
    return this
  }

  /**
   * Specifies the destination node for the transaction.
   *
   * @param node - The node to which the transaction is sent.
   * @param paraIdTo - (Optional) The parachain ID of the destination node.
   * @returns An instance of Builder
   */
  to(node: TDestination, paraIdTo?: number) {
    if (isRelayChain(this._from) && node === 'Ethereum') {
      throw new Error('Transfers from Relay chain to Ethereum are not yet supported.')
    }
    this._to = node
    this._paraIdTo = paraIdTo
    return this
  }

  /**
   * Initiates the process to claim assets from a specified node.
   *
   * @param node - The node from which to claim assets.
   * @returns An instance of Builder
   */
  claimFrom(node: TNodeWithRelayChains): IFungibleBuilder<TRes> {
    return AssetClaimBuilder.create(this.api, node)
  }

  /**
   * Specifies the currency to be used in the transaction. Symbol, ID, multi-location or multi-asset.
   *
   * @param currency - The currency to be transferred.
   * @returns An instance of Builder
   */
  currency(currency: TCurrencyInputWithAmount): this {
    this._currency = currency
    return this
  }

  /**
   * Sets the recipient address.
   *
   * @param address - The destination address.
   * @returns An instance of Builder
   */
  address(address: TAddress, ahAddress?: string): this {
    this._address = address
    this._ahAddress = ahAddress
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

  /**
   * Sets a custom pallet for the transaction.
   *
   * @param palletName - The name of the custom pallet to be used.
   * @returns An instance of the Builder.
   */
  customPallet(pallet: string, method: string): this {
    this._pallet = pallet
    this._method = method
    return this
  }

  private createOptions(): TSendOptions<TApi, TRes> {
    return {
      api: this.api,
      origin: this._from,
      currency: this._currency,
      address: this._address,
      destination: this._to,
      paraIdTo: this._paraIdTo,
      version: this._version,
      ahAddress: this._ahAddress,
      pallet: this._pallet,
      method: this._method
    }
  }

  /**
   * Adds the transfer transaction to the batch.
   *
   * @returns An instance of Builder
   */
  addToBatch() {
    this.batchManager.addTransaction(this.createOptions())
    return new GeneralBuilder(this.batchManager, this.api, this._from)
  }

  /**
   * Builds and returns the batched transaction based on the configured parameters.
   *
   * @param options - (Optional) Options to customize the batch transaction.
   * @returns A Extrinsic representing the batched transactions.
   */
  async buildBatch(options?: TBatchOptions) {
    return this.batchManager.buildBatch(this.api, this._from, options)
  }

  /**
   * Builds and returns the transfer extrinsic.
   *
   * @returns A Promise that resolves to the transfer extrinsic.
   */
  async build() {
    if (!this.batchManager.isEmpty()) {
      throw new Error(
        'Transaction manager contains batched items. Use buildBatch() to process them.'
      )
    }

    if (!isTMultiLocation(this._to) && isRelayChain(this._from) && isRelayChain(this._to)) {
      throw new Error('Transfers between relay chains are not yet supported.')
    }

    const options = this.createOptions()
    return send(options)
  }

  async dryRun() {
    this.api.setDisconnectAllowed(false)
    const tx = await this.build()

    if (typeof this._address !== 'string') {
      throw new Error('Address must be a string when using dryRun')
    }

    this.api.setDisconnectAllowed(true)

    return getDryRun({
      api: this.api,
      tx,
      address: this._address,
      node: this._from
    })
  }

  async disconnect() {
    return this.api.disconnect(true)
  }
}

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
export const Builder = <TApi, TRes>(api: IPolkadotApi<TApi, TRes>): IFromBuilder<TApi, TRes> => {
  return new GeneralBuilder(new BatchTransactionManager(), api)
}
