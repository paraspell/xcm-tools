// Implements general builder pattern, this is Builder main file

import type { IPolkadotApi } from '../api/IPolkadotApi'
import { isTMultiLocation } from '../pallets/xcmPallet/utils'
import { getDryRun, send } from '../transfer'
import type {
  TAddress,
  TBatchOptions,
  TCurrencyInputWithAmount,
  TDestination,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
  TSendBaseOptions,
  Version
} from '../types'
import { isRelayChain } from '../utils'
import AssetClaimBuilder from './AssetClaimBuilder'
import BatchTransactionManager from './BatchTransactionManager'

/**
 * A builder class for constructing Para-to-Para, Para-to-Relay, Relay-to-Para transactions and asset claims.
 */
export class GeneralBuilder<TApi, TRes, T extends Partial<TSendBaseOptions> = object> {
  readonly api: IPolkadotApi<TApi, TRes>
  readonly _options: T

  constructor(
    api: IPolkadotApi<TApi, TRes>,
    readonly batchManager: BatchTransactionManager<TApi, TRes>,
    options?: T
  ) {
    this.api = api
    this._options = options ?? ({} as T)
  }

  /**
   * Specifies the origin node for the transaction.
   *
   * @param node - The node from which the transaction originates.
   * @returns An instance of Builder
   */
  from(
    node: TNodeDotKsmWithRelayChains
  ): GeneralBuilder<TApi, TRes, T & { from: TNodeDotKsmWithRelayChains }> {
    return new GeneralBuilder(this.api, this.batchManager, { ...this._options, from: node })
  }

  /**
   * Specifies the destination node for the transaction.
   *
   * @param node - The node to which the transaction is sent.
   * @param paraIdTo - (Optional) The parachain ID of the destination node.
   * @returns An instance of Builder
   */
  to(node: TDestination, paraIdTo?: number): GeneralBuilder<TApi, TRes, T & { to: TDestination }> {
    if (this._options.from && isRelayChain(this._options.from) && node === 'Ethereum') {
      throw new Error('Transfers from Relay chain to Ethereum are not yet supported.')
    }
    return new GeneralBuilder(this.api, this.batchManager, {
      ...this._options,
      to: node,
      paraIdTo
    })
  }

  /**
   * Initiates the process to claim assets from a specified node.
   *
   * @param node - The node from which to claim assets.
   * @returns An instance of Builder
   */
  claimFrom(node: TNodeWithRelayChains) {
    return new AssetClaimBuilder<TApi, TRes, { node: TNodeWithRelayChains }>(this.api, {
      node
    })
  }

  /**
   * Specifies the currency to be used in the transaction. Symbol, ID, multi-location or multi-asset.
   *
   * @param currency - The currency to be transferred.
   * @returns An instance of Builder
   */
  currency(
    currency: TCurrencyInputWithAmount
  ): GeneralBuilder<TApi, TRes, T & { currency: TCurrencyInputWithAmount }> {
    return new GeneralBuilder(this.api, this.batchManager, { ...this._options, currency })
  }

  /**
   * Sets the recipient address.
   *
   * @param address - The destination address.
   * @returns An instance of Builder
   */
  address(
    address: TAddress,
    senderAddress?: string
  ): GeneralBuilder<TApi, TRes, T & { address: TAddress }> {
    return new GeneralBuilder(this.api, this.batchManager, {
      ...this._options,
      address,
      senderAddress
    })
  }

  /**
   * Sets the XCM version to be used for the transfer.
   *
   * @param version - The XCM version.
   * @returns An instance of Builder
   */
  xcmVersion(version: Version) {
    return new GeneralBuilder(this.api, this.batchManager, { ...this._options, version })
  }

  /**
   * Sets a custom pallet for the transaction.
   *
   * @param palletName - The name of the custom pallet to be used.
   * @returns An instance of the Builder.
   */
  customPallet(pallet: string, method: string) {
    return new GeneralBuilder(this.api, this.batchManager, { ...this._options, pallet, method })
  }

  /**
   * Adds the transfer transaction to the batch.
   *
   * @returns An instance of Builder
   */
  addToBatch(
    this: GeneralBuilder<TApi, TRes, TSendBaseOptions>
  ): GeneralBuilder<TApi, TRes, T & { from: TNodeDotKsmWithRelayChains }> {
    this.batchManager.addTransaction({ api: this.api, ...this._options })
    return new GeneralBuilder<TApi, TRes, T & { from: TNodeDotKsmWithRelayChains }>(
      this.api,
      this.batchManager,
      {
        from: this._options.from
      } as T & { from: TNodeDotKsmWithRelayChains }
    )
  }

  /**
   * Builds and returns the batched transaction based on the configured parameters.
   *
   * @param options - (Optional) Options to customize the batch transaction.
   * @returns A Extrinsic representing the batched transactions.
   */
  async buildBatch(this: GeneralBuilder<TApi, TRes, TSendBaseOptions>, options?: TBatchOptions) {
    return this.batchManager.buildBatch(this.api, this._options.from, options)
  }

  /**
   * Builds and returns the transfer extrinsic.
   *
   * @returns A Promise that resolves to the transfer extrinsic.
   */
  async build(this: GeneralBuilder<TApi, TRes, TSendBaseOptions>) {
    if (!this.batchManager.isEmpty()) {
      throw new Error(
        'Transaction manager contains batched items. Use buildBatch() to process them.'
      )
    }

    if (
      !isTMultiLocation(this._options.to) &&
      isRelayChain(this._options.from) &&
      isRelayChain(this._options.to)
    ) {
      throw new Error('Transfers between relay chains are not yet supported.')
    }

    return send({ api: this.api, ...this._options })
  }

  async dryRun(this: GeneralBuilder<TApi, TRes, TSendBaseOptions>, senderAddress: string) {
    this.api.setDisconnectAllowed(false)
    const tx = await this.build()

    this.api.setDisconnectAllowed(true)

    return getDryRun({
      api: this.api,
      tx,
      address: senderAddress,
      node: this._options.from
    })
  }

  /**
   * Returns the API instance used by the builder.
   *
   * @returns The API instance.
   */
  getApi() {
    return this.api.getApi()
  }

  /**
   * Disconnects the API.
   *
   * @returns A Promise that resolves when the API is disconnected.
   */
  disconnect() {
    return this.api.disconnect(true)
  }
}

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
export const Builder = <TApi, TRes>(api: IPolkadotApi<TApi, TRes>) =>
  new GeneralBuilder<TApi, TRes>(api, new BatchTransactionManager())
