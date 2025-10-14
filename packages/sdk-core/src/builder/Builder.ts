// Implements general builder pattern, this is Builder main file

import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import { type TCurrencyInput, type TCurrencyInputWithAmount } from '@paraspell/assets'
import type { TSubstrateChain, Version } from '@paraspell/sdk-common'
import { isRelayChain, isTLocation } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import { MIN_AMOUNT } from '../constants'
import { DryRunFailedError, InvalidParameterError, UnableToComputeError } from '../errors'
import {
  getMinTransferableAmount,
  getOriginXcmFee,
  getOriginXcmFeeEstimate,
  getTransferableAmount,
  getTransferInfo,
  getXcmFee,
  getXcmFeeEstimate,
  send,
  verifyEdOnDestination
} from '../transfer'
import type {
  TAddress,
  TBatchOptions,
  TBuildInternalRes,
  TDestination,
  TDryRunPreviewOptions,
  TGetXcmFeeBuilderOptions,
  TSendBaseOptions,
  TSendBaseOptionsWithSenderAddress,
  TSendOptions,
  TTxFactory
} from '../types'
import {
  assertAddressIsString,
  assertSenderAddress,
  assertToIsString,
  createTx,
  isConfig
} from '../utils'
import AssetClaimBuilder from './AssetClaimBuilder'
import BatchTransactionManager from './BatchTransactionManager'
import { buildDryRun } from './buildDryRun'
import { normalizeAmountAll } from './normalizeAmountAll'

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
   * Specifies the origin chain for the transaction.
   *
   * @param chain - The chain from which the transaction originates.
   * @returns An instance of Builder
   */
  from(chain: TSubstrateChain): GeneralBuilder<TApi, TRes, T & { from: TSubstrateChain }> {
    return new GeneralBuilder(this.api, this.batchManager, { ...this._options, from: chain })
  }

  /**
   * Specifies the destination chain for the transaction.
   *
   * @param chain - The chain to which the transaction is sent.
   * @param paraIdTo - (Optional) The parachain ID of the destination chain.
   * @returns An instance of Builder
   */
  to(chain: TDestination, paraIdTo?: number): GeneralBuilder<TApi, TRes, T & { to: TDestination }> {
    if (this._options.from && isRelayChain(this._options.from) && chain === 'Ethereum') {
      throw new InvalidParameterError(
        'Transfers from Relay chain to Ethereum are not yet supported.'
      )
    }
    return new GeneralBuilder(this.api, this.batchManager, {
      ...this._options,
      to: chain,
      paraIdTo
    })
  }

  /**
   * Initiates the process to claim assets from a specified chain.
   *
   * @param chain - The chain from which to claim assets.
   * @returns An instance of Builder
   */
  claimFrom(chain: TSubstrateChain) {
    return new AssetClaimBuilder<TApi, TRes, { chain: TSubstrateChain }>(this.api, {
      chain
    })
  }

  /**
   * Specifies the currency to be used in the transaction. Symbol, ID, location or multi-asset.
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
  address(address: TAddress): GeneralBuilder<TApi, TRes, T & { address: TAddress }> {
    return new GeneralBuilder(this.api, this.batchManager, {
      ...this._options,
      address
    })
  }

  /**
   * Sets the sender address.
   *
   * @param address - The sender address.
   * @returns
   */
  senderAddress(address: string): GeneralBuilder<TApi, TRes, T & { senderAddress: string }> {
    return new GeneralBuilder(this.api, this.batchManager, {
      ...this._options,
      senderAddress: address
    })
  }

  /**
   * Sets the asset hub address. This is used for transfers that go through the Asset Hub and originate from an EVM chain.
   *
   * @param address - The address to be used.
   * @returns An instance of Builder
   */
  ahAddress(address: string | undefined) {
    return new GeneralBuilder(this.api, this.batchManager, {
      ...this._options,
      ahAddress: address
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
   * Optional fee asset for the transaction.
   *
   * @param currency - The currency to be used for the fee.
   * @returns An instance of the Builder
   */
  feeAsset(currency: TCurrencyInput | undefined) {
    return new GeneralBuilder(this.api, this.batchManager, { ...this._options, feeAsset: currency })
  }

  /**
   * Adds the transfer transaction to the batch.
   *
   * @returns An instance of Builder
   */
  addToBatch(
    this: GeneralBuilder<TApi, TRes, TSendBaseOptions>
  ): GeneralBuilder<TApi, TRes, T & { from: TSubstrateChain }> {
    const buildTx = this.createTxFactory()

    this.batchManager.addTransaction({
      api: this.api,
      ...this._options,
      buildTx
    })

    return new GeneralBuilder<TApi, TRes, T & { from: TSubstrateChain }>(
      this.api,
      this.batchManager,
      {
        from: this._options.from
      } as T & { from: TSubstrateChain }
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

  protected buildInternal<TOptions extends TSendBaseOptions>(
    this: GeneralBuilder<TApi, TRes, TOptions>
  ): Promise<TBuildInternalRes<TApi, TRes, TOptions>> {
    return this.buildCommon<TOptions>(true)
  }

  private async prepareNormalizedOptions<TOptions extends TSendBaseOptions>(
    this: GeneralBuilder<TApi, TRes, TOptions>,
    options: TOptions
  ): Promise<{
    normalizedOptions: TSendOptions<TApi, TRes> & TOptions
    buildTx: TTxFactory<TRes>
  }> {
    const builder = this.currency({
      ...options.currency,
      amount: MIN_AMOUNT.toString()
    })
    const buildTx = builder.createTxFactory()

    const normalizedOptions = await normalizeAmountAll(this.api, buildTx, options)

    return { normalizedOptions, buildTx }
  }

  /**
   * Builds and returns the transfer extrinsic.
   *
   * @returns A Promise that resolves to the transfer extrinsic.
   */
  async build(this: GeneralBuilder<TApi, TRes, TSendBaseOptions>): Promise<TRes> {
    const { tx } = await this.buildCommon()
    return tx
  }

  private async buildCommon<TOptions extends TSendBaseOptions>(
    this: GeneralBuilder<TApi, TRes, TOptions>,
    isCalledInternally = false
  ): Promise<TBuildInternalRes<TApi, TRes, TOptions>> {
    if (!this.batchManager.isEmpty() && !isCalledInternally) {
      throw new InvalidParameterError(
        'Transaction manager contains batched items. Use buildBatch() to process them.'
      )
    }

    const { from, to } = this._options

    if (!isTLocation(to) && isRelayChain(from) && isRelayChain(to) && from !== to) {
      throw new InvalidParameterError('Transfers between relay chains are not yet supported.')
    }

    const { normalizedOptions } = await this.prepareNormalizedOptions(this._options)

    const tx = await send(normalizedOptions)

    await this.maybePerformXcmFormatCheck(tx, normalizedOptions, isCalledInternally)

    return { tx, options: normalizedOptions }
  }

  private async maybePerformXcmFormatCheck(
    tx: TRes,
    options: TSendBaseOptions,
    isCalledInternally: boolean
  ) {
    const { senderAddress } = options

    const config = this.api.getConfig()
    if (isConfig(config) && config.xcmFormatCheck && !isCalledInternally) {
      assertSenderAddress(senderAddress)
      const dryRunResult = await buildDryRun(
        this.api,
        tx,
        {
          ...options,
          senderAddress
        },
        {
          sentAssetMintMode: 'bypass'
        }
      )

      if (dryRunResult.failureReason) {
        throw new DryRunFailedError(dryRunResult.failureReason, dryRunResult.failureChain)
      }
    }
  }

  async dryRun(this: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>) {
    const { tx, options } = await this.buildInternal()
    return buildDryRun(this.api, tx, options)
  }

  async dryRunPreview(
    this: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>,
    dryRunOptions?: TDryRunPreviewOptions
  ) {
    const { tx, options } = await this.buildInternal()
    return buildDryRun(this.api, tx, options, {
      sentAssetMintMode: 'preview',
      mintFeeAssets: dryRunOptions?.mintFeeAssets
    })
  }

  private createTxFactory<TOptions extends TSendBaseOptions>(
    this: GeneralBuilder<TApi, TRes, TOptions>
  ) {
    return (amount: string | undefined) =>
      createTx({ ...this._options, api: this.api }, this, amount)
  }

  /**
   * Returns the XCM fee for the transfer using dryRun or paymentInfo function.
   *
   * @returns An origin and destination fee.
   */
  async getXcmFee<TDisableFallback extends boolean = false>(
    this: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>,
    options?: TGetXcmFeeBuilderOptions & { disableFallback: TDisableFallback }
  ) {
    const disableFallback = (options?.disableFallback ?? false) as TDisableFallback

    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, senderAddress, address, currency, feeAsset } = normalizedOptions

    assertToIsString(to)
    assertAddressIsString(address)

    try {
      return await getXcmFee({
        api,
        buildTx,
        origin: from,
        destination: to,
        senderAddress,
        address,
        currency: currency as WithAmount<TCurrencyCore>,
        feeAsset,
        disableFallback
      })
    } finally {
      await this.api.disconnect()
    }
  }

  /**
   * Returns the origin XCM fee for the transfer using dryRun or paymentInfo function.
   *
   * @returns An origin fee.
   */
  async getOriginXcmFee(
    this: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>,
    { disableFallback }: TGetXcmFeeBuilderOptions = { disableFallback: false }
  ) {
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, senderAddress, currency, feeAsset } = normalizedOptions

    assertToIsString(to)

    try {
      return await getOriginXcmFee({
        api,
        buildTx,
        origin: from,
        destination: to,
        senderAddress,
        currency: currency as WithAmount<TCurrencyCore>,
        feeAsset,
        disableFallback
      })
    } finally {
      await this.api.disconnect()
    }
  }

  /**
   * Estimates the origin and destination XCM fee using paymentInfo function.
   *
   * @returns An origin and destination fee estimate.
   */
  async getXcmFeeEstimate(this: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>) {
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, address, senderAddress, currency } = normalizedOptions

    assertToIsString(to)
    assertAddressIsString(address)

    const tx = await buildTx()

    try {
      return await getXcmFeeEstimate({
        api,
        tx,
        origin: from,
        destination: to,
        address,
        senderAddress,
        currency: currency as WithAmount<TCurrencyCore>
      })
    } finally {
      await this.api.disconnect()
    }
  }

  /**
   * Estimates the origin XCM fee using paymentInfo function.
   *
   * @returns An origin fee estimate.
   */
  async getOriginXcmFeeEstimate(
    this: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>
  ) {
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, senderAddress, currency } = normalizedOptions

    assertToIsString(to)

    const tx = await buildTx()

    try {
      return await getOriginXcmFeeEstimate({
        api,
        tx,
        origin: from,
        destination: to,
        currency: currency as WithAmount<TCurrencyCore>,
        senderAddress
      })
    } finally {
      await this.api.disconnect()
    }
  }

  /**
   * Returns the max transferable amount for the transfer
   *
   * @returns The max transferable amount.
   */
  async getTransferableAmount(this: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>) {
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, senderAddress, currency, feeAsset } = normalizedOptions

    assertToIsString(to)

    return getTransferableAmount({
      api,
      buildTx,
      origin: from,
      destination: to,
      senderAddress,
      feeAsset,
      currency: currency as WithAmount<TCurrencyCore>
    })
  }

  /**
   * Returns the min transferable amount for the transfer
   *
   * @returns The min transferable amount.
   */
  async getMinTransferableAmount(
    this: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>
  ) {
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, senderAddress, address, currency, feeAsset } = normalizedOptions

    assertToIsString(to)
    assertAddressIsString(address)

    return getMinTransferableAmount({
      api,
      buildTx,
      origin: from,
      destination: to,
      senderAddress,
      address,
      feeAsset,
      currency: currency as WithAmount<TCurrencyCore>,
      builder: this
    })
  }

  /**
   * Returns the max transferable amount for the transfer
   *
   * @returns The max transferable amount.
   */
  async verifyEdOnDestination(this: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>) {
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, address, currency, senderAddress, feeAsset } = normalizedOptions

    assertToIsString(to)
    assertAddressIsString(address)

    return verifyEdOnDestination({
      api,
      buildTx,
      origin: from,
      destination: to,
      address,
      senderAddress,
      feeAsset,
      currency: currency as WithAmount<TCurrencyCore>
    })
  }

  /**
   * Returns the transfer info for the transfer
   *
   * @returns The transfer info.
   */
  async getTransferInfo(this: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>) {
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, address, currency, ahAddress, senderAddress, feeAsset } =
      normalizedOptions

    assertToIsString(to)
    assertAddressIsString(address)

    return getTransferInfo({
      api,
      buildTx,
      origin: from,
      destination: to,
      address,
      senderAddress,
      ahAddress,
      currency: currency as WithAmount<TCurrencyCore>,
      feeAsset: feeAsset as TCurrencyCore
    })
  }

  /**
   * Returns the receivable amount on the destination after the transfer
   *
   * @returns The computed receivable amount.
   * @throws \{UnableToComputeError\} Thrown when the receivable amount cannot be determined.
   */
  async getReceivableAmount(this: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>) {
    const {
      destination: {
        receivedCurrency: { receivedAmount }
      }
    } = await this.getTransferInfo()

    if (receivedAmount instanceof UnableToComputeError) {
      throw receivedAmount
    }

    return receivedAmount
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
    return this.api.disconnect()
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
