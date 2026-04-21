// Implements general builder pattern, this is Builder main file

import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import { type TCurrencyInput, type TCurrencyInputWithAmount } from '@paraspell/assets'
import type { TSubstrateChain, Version } from '@paraspell/sdk-common'
import type { WalletClient } from 'viem'

import type { PolkadotApi } from '../api/PolkadotApi'
import {
  BatchValidationError,
  DryRunFailedError,
  InvalidAddressError,
  UnableToComputeError,
  UnsupportedOperationError
} from '../errors'
import {
  getMinTransferableAmount,
  getOriginXcmFee,
  getTransferableAmount,
  getTransferInfo,
  getXcmFee,
  verifyEdOnDestination
} from '../transfer'
import type {
  TAddress,
  TBatchOptions,
  TBuildAllInternalRes,
  TBuilderInternalOptions,
  TBuildInternalRes,
  TDestination,
  TDryRunPreviewOptions,
  TDryRunResult,
  TGetXcmFeeBuilderOptions,
  TGetXcmFeeResult,
  TSender,
  TSwapOptions,
  TTransactionContext,
  TTransactOrigin,
  TTransferBaseOptions,
  TTransferBaseOptionsWithSender,
  TTransferBaseOptionsWithSwap,
  TTransferOptions,
  TTxFactory,
  TWeight
} from '../types'
import {
  assertAddressIsString,
  assertSender,
  assertSenderSource,
  assertSwapSupport,
  assertToIsString,
  createTransferOrSwap,
  createTransferOrSwapAll,
  createTxOverrideAmount,
  executeWithRouter,
  getEvmExtensionOrThrow,
  isConfig,
  isSenderSigner,
  isViemSigner,
  normalizeExchange
} from '../utils'
import AssetClaimBuilder from './AssetClaimBuilder'
import BatchTransactionManager from './BatchTransactionManager'
import { buildDryRun } from './buildDryRun'
import { normalizeAmountAll } from './normalizeAmountAll'

/**
 * A builder class for constructing Para-to-Para, Para-to-Relay, Relay-to-Para transactions and asset claims.
 */
export class GeneralBuilder<
  TApi,
  TRes,
  TSigner,
  T extends Partial<TTransferBaseOptions<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>> =
    object
> {
  readonly api: PolkadotApi<TApi, TRes, TSigner>
  readonly _options: T

  constructor(
    api: PolkadotApi<TApi, TRes, TSigner>,
    readonly batchManager: BatchTransactionManager<TApi, TRes, TSigner>,
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
  from(chain: TSubstrateChain): GeneralBuilder<TApi, TRes, TSigner, T & { from: TSubstrateChain }> {
    return new GeneralBuilder(this.api, this.batchManager, { ...this._options, from: chain })
  }

  /**
   * Specifies the destination chain for the transaction.
   *
   * @param chain - The chain to which the transaction is sent.
   * @param paraIdTo - (Optional) The parachain ID of the destination chain.
   * @returns An instance of Builder
   */
  to(
    chain: TDestination,
    paraIdTo?: number
  ): GeneralBuilder<TApi, TRes, TSigner, T & { to: TDestination }> {
    return new GeneralBuilder(this.api, this.batchManager, {
      ...this._options,
      to: chain,
      paraIdTo
    })
  }

  /**
   * Initiates the process to claim assets from a specified chain.
   *
   * @deprecated Asset claim functionality is deprecated and will be removed in v14.
   * @param chain - The chain from which to claim assets.
   * @returns An instance of Builder
   */
  claimFrom(chain: TSubstrateChain) {
    return new AssetClaimBuilder<TApi, TRes, TSigner, { chain: TSubstrateChain }>(this.api, {
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
  ): GeneralBuilder<TApi, TRes, TSigner, T & { currency: TCurrencyInputWithAmount }> {
    return new GeneralBuilder(this.api, this.batchManager, { ...this._options, currency })
  }

  /**
   * Sets the recipient address.
   *
   * @param address - The recipient address on the destination chain.
   * @returns An instance of Builder
   */
  recipient(address: TAddress): GeneralBuilder<TApi, TRes, TSigner, T & { recipient: TAddress }> {
    const isPath = typeof address === 'string' && address.startsWith('//')
    const resolvedAddress = isPath ? this.api.deriveAddress(address) : address
    return new GeneralBuilder(this.api, this.batchManager, {
      ...this._options,
      recipient: resolvedAddress
    })
  }

  /**
   * Sets the sender address or signer.
   *
   * @param sender - The sender address, substrate signer, or viem `WalletClient`.
   * @returns An instance of Builder
   */
  sender(
    sender: TSender<TSigner> | WalletClient
  ): GeneralBuilder<TApi, TRes, TSigner, T & { sender: string }> {
    if (isViemSigner(sender)) {
      const address = sender.account?.address
      if (!address) {
        throw new InvalidAddressError(
          'viem WalletClient has no account attached. Create it with a specific account.'
        )
      }
      return new GeneralBuilder(this.api, this.batchManager, {
        ...this._options,
        sender: address,
        senderSource: sender
      })
    }

    const isPath = typeof sender === 'string' && sender.startsWith('//')
    const isPathOrSigner = isPath || isSenderSigner(sender)
    const address = isPathOrSigner ? this.api.deriveAddress(sender) : sender
    return new GeneralBuilder(this.api, this.batchManager, {
      ...this._options,
      sender: address,
      senderSource: isPathOrSigner ? sender : undefined
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
   * Whether to keep the account alive after the transfer.
   *
   * @param value - A boolean indicating whether to keep the account alive.
   * @returns An instance of Builder
   */
  keepAlive(keepAlive: boolean) {
    return new GeneralBuilder(this.api, this.batchManager, { ...this._options, keepAlive })
  }

  /**
   * Sets a custom pallet for the transaction.
   *
   * @param pallet - The name of the custom pallet to be used.
   * @param method - The name of the method to be used.
   * @returns An instance of the Builder.
   */
  customPallet(pallet: string | undefined, method: string | undefined) {
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
   * Sets the hex of the encoded transaction call to apply on the destination chain
   *
   * @param hex - The encoded call hex or extrinsics.
   * @param originKind - (Optional) The means of expressing the message origin as a dispatch origin.
   * @param maxWeight - (Optional) The weight of the call. If not provided, the weight will be estimated.
   * @returns An instance of the Builder.
   */
  transact(call: string | TRes, originKind?: TTransactOrigin, maxWeight?: TWeight) {
    return new GeneralBuilder(this.api, this.batchManager, {
      ...this._options,
      transactOptions: {
        ...this._options.transactOptions,
        call,
        originKind,
        maxWeight
      }
    })
  }

  /**
   * Performs a token swap as part of the transfer, using the specified exchange and destination currency.
   *
   * @param options - The swap options.
   * @returns An instance of the Builder.
   */
  swap(
    options: TSwapOptions<TApi, TRes, TSigner>
  ): GeneralBuilder<TApi, TRes, TSigner, T & { swapOptions: TSwapOptions<TApi, TRes, TSigner> }> {
    return new GeneralBuilder(this.api, this.batchManager, {
      ...this._options,
      swapOptions: {
        ...options,
        exchange: normalizeExchange(options.exchange)
      }
    })
  }

  /**
   * Adds the transfer transaction to the batch.
   *
   * @returns An instance of Builder
   */
  addToBatch(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptions<TApi, TRes, TSigner>>
  ): GeneralBuilder<TApi, TRes, TSigner, T & { from: TSubstrateChain }> {
    this.assertNotEvmSigner()
    this.batchManager.addTransaction({
      api: this.api,
      ...this._options,
      builder: this
    })

    return new GeneralBuilder<TApi, TRes, TSigner, T & { from: TSubstrateChain }>(
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
  async buildBatch(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptions<TApi, TRes, TSigner>>,
    options?: TBatchOptions
  ) {
    this.assertNotEvmSigner()
    return this.batchManager.buildBatch(this.api, this._options.from, options)
  }

  protected buildInternal<TOptions extends TTransferBaseOptions<TApi, TRes, TSigner>>(
    this: GeneralBuilder<TApi, TRes, TSigner, TOptions>
  ): Promise<TBuildInternalRes<TApi, TRes, TSigner, TOptions>> {
    return this.buildCommon<TOptions>(true)
  }

  private async prepareNormalizedOptions<
    TOptions extends TTransferBaseOptions<TApi, TRes, TSigner>
  >(
    this: GeneralBuilder<TApi, TRes, TSigner, TOptions>,
    options: TOptions
  ): Promise<{
    normalizedOptions: TTransferOptions<TApi, TRes, TSigner> & TOptions
    buildTx: TTxFactory<TRes>
  }> {
    const { options: normalizedOptions, buildTx } = await normalizeAmountAll(
      this.api,
      this,
      options
    )

    return { normalizedOptions, buildTx }
  }

  /**
   * Builds and returns the transfer extrinsic.
   *
   * @returns A Promise that resolves to the transfer extrinsic.
   */
  async build(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptions<TApi, TRes, TSigner>>
  ): Promise<TRes> {
    this.assertNotEvmSigner()
    const { tx } = await this.buildCommon()
    return tx
  }

  /**
   * Builds and returns multiple transfer or swap extrinsics
   *
   * @returns A Promise that resolves to the transfer extrinsic contexts
   */
  async buildAll(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptions<TApi, TRes, TSigner>>
  ): Promise<TTransactionContext<TApi, TRes>[]> {
    this.assertNotEvmSigner()
    const { txContexts } = await this.buildCommonAll()
    return txContexts
  }

  private assertNotEvmSigner() {
    if (isViemSigner(this._options.senderSource)) {
      throw new UnsupportedOperationError(
        'This operation is not supported for EVM transfers. Call .signAndSubmit() with your viem WalletClient instead.'
      )
    }
  }

  private validateBatchState(isCalledInternally: boolean) {
    if (!this.batchManager.isEmpty() && !isCalledInternally) {
      throw new BatchValidationError(
        'Transaction manager contains batched items. Use buildBatch() to process them.'
      )
    }
  }

  private async buildCommon<TOptions extends TTransferBaseOptions<TApi, TRes, TSigner>>(
    this: GeneralBuilder<TApi, TRes, TSigner, TOptions>,
    isCalledInternally = false
  ): Promise<TBuildInternalRes<TApi, TRes, TSigner, TOptions>> {
    this.validateBatchState(isCalledInternally)

    const { normalizedOptions } = await this.prepareNormalizedOptions(this._options)

    const tx = await createTransferOrSwap(normalizedOptions)

    await this.maybePerformXcmFormatCheck(tx, normalizedOptions, isCalledInternally)

    return { tx, options: normalizedOptions }
  }

  private async buildCommonAll<TOptions extends TTransferBaseOptions<TApi, TRes, TSigner>>(
    this: GeneralBuilder<TApi, TRes, TSigner, TOptions>,
    isCalledInternally = false
  ): Promise<TBuildAllInternalRes<TApi, TRes, TSigner, TOptions>> {
    this.validateBatchState(isCalledInternally)

    const { normalizedOptions } = await this.prepareNormalizedOptions(this._options)

    const txContexts = await createTransferOrSwapAll(normalizedOptions)

    return { txContexts: txContexts, options: normalizedOptions }
  }

  private async maybePerformXcmFormatCheck(
    tx: TRes,
    options: TTransferBaseOptions<TApi, TRes, TSigner>,
    isCalledInternally: boolean
  ) {
    const { sender } = options

    const { config } = this.api
    if (isConfig(config) && config.xcmFormatCheck && !isCalledInternally) {
      assertSender(sender)
      const dryRunResult = await buildDryRun(
        this.api,
        tx,
        {
          ...options,
          sender
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

  async dryRun(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptionsWithSender<TApi, TRes, TSigner>>
  ): Promise<TDryRunResult> {
    const { swapOptions } = this._options

    if (swapOptions) {
      return executeWithRouter({ ...this._options, api: this.api, swapOptions }, builder =>
        builder.dryRun()
      )
    }

    const { tx, options } = await this.buildInternal()
    return buildDryRun(this.api, tx, options)
  }

  async dryRunPreview(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptionsWithSender<TApi, TRes, TSigner>>,
    dryRunOptions?: TDryRunPreviewOptions
  ) {
    const { swapOptions } = this._options

    assertSwapSupport(swapOptions)

    const { tx, options } = await this.buildInternal()
    return buildDryRun(this.api, tx, options, {
      sentAssetMintMode: 'preview',
      mintFeeAssets: dryRunOptions?.mintFeeAssets
    })
  }

  protected createTxFactory<TOptions extends TTransferBaseOptions<TApi, TRes, TSigner>>(
    this: GeneralBuilder<TApi, TRes, TSigner, TOptions>
  ): TTxFactory<TRes> {
    return (amount, relative) =>
      createTxOverrideAmount({ ...this._options, api: this.api }, this, amount, relative)
  }

  /**
   * Returns the XCM fee for the transfer using dryRun or paymentInfo function.
   *
   * @returns An origin and destination fee.
   */
  async getXcmFee<TDisableFallback extends boolean = false>(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptionsWithSender<TApi, TRes, TSigner>>,
    options?: TGetXcmFeeBuilderOptions & { disableFallback: TDisableFallback }
  ): Promise<TGetXcmFeeResult<TDisableFallback>> {
    const disableFallback = (options?.disableFallback ?? false) as TDisableFallback

    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, sender, recipient, currency, feeAsset, version, swapOptions } =
      normalizedOptions

    assertToIsString(to)
    assertAddressIsString(recipient)

    if (swapOptions) {
      return executeWithRouter({ ...normalizedOptions, swapOptions }, builder =>
        builder.getXcmFees(options)
      )
    }

    return getXcmFee({
      api,
      buildTx,
      origin: from,
      destination: to,
      sender,
      recipient,
      version,
      currency: currency as WithAmount<TCurrencyCore>,
      feeAsset,
      disableFallback
    })
  }

  /**
   * Returns the origin XCM fee for the transfer using dryRun or paymentInfo function.
   *
   * @returns An origin fee.
   */
  async getOriginXcmFee(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptionsWithSender<TApi, TRes, TSigner>>,
    { disableFallback }: TGetXcmFeeBuilderOptions = { disableFallback: false }
  ) {
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, sender, currency, feeAsset, version, swapOptions } = normalizedOptions

    assertToIsString(to)
    assertSwapSupport(swapOptions)

    try {
      return await getOriginXcmFee({
        api,
        buildTx,
        origin: from,
        destination: to,
        sender,
        version,
        currency: currency as WithAmount<TCurrencyCore>,
        feeAsset,
        disableFallback
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
  async getTransferableAmount(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptionsWithSender<TApi, TRes, TSigner>>
  ) {
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, sender, currency, feeAsset, version, swapOptions } = normalizedOptions

    assertToIsString(to)

    if (swapOptions) {
      return executeWithRouter({ ...normalizedOptions, swapOptions }, builder =>
        builder.getTransferableAmount()
      )
    }

    return getTransferableAmount({
      api,
      buildTx,
      origin: from,
      destination: to,
      sender,
      feeAsset,
      version,
      currency: currency as WithAmount<TCurrencyCore>
    })
  }

  /**
   * Returns the min transferable amount for the transfer
   *
   * @returns The min transferable amount.
   */
  async getMinTransferableAmount(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptionsWithSender<TApi, TRes, TSigner>>
  ) {
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, sender, recipient, currency, feeAsset, version, swapOptions } =
      normalizedOptions

    assertToIsString(to)
    assertAddressIsString(recipient)

    if (swapOptions) {
      return executeWithRouter({ ...normalizedOptions, swapOptions }, builder =>
        builder.getMinTransferableAmount()
      )
    }

    return getMinTransferableAmount({
      api,
      buildTx,
      origin: from,
      destination: to,
      sender,
      recipient,
      feeAsset,
      version,
      currency: currency as WithAmount<TCurrencyCore>,
      builder: this
    })
  }

  /**
   * Returns the max transferable amount for the transfer
   *
   * @returns The max transferable amount.
   */
  async verifyEdOnDestination(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptionsWithSender<TApi, TRes, TSigner>>
  ) {
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, sender, recipient, currency, feeAsset, version, swapOptions } =
      normalizedOptions

    assertToIsString(to)
    assertAddressIsString(recipient)
    assertSwapSupport(swapOptions)

    return verifyEdOnDestination({
      api,
      buildTx,
      origin: from,
      destination: to,
      sender,
      recipient,
      version,
      feeAsset,
      currency: currency as WithAmount<TCurrencyCore>
    })
  }

  /**
   * Returns the transfer info for the transfer
   *
   * @returns The transfer info.
   */
  async getTransferInfo(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptionsWithSender<TApi, TRes, TSigner>>
  ) {
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const {
      api,
      from,
      to,
      recipient,
      currency,
      ahAddress,
      sender,
      feeAsset,
      version,
      swapOptions
    } = normalizedOptions

    assertToIsString(to)
    assertAddressIsString(recipient)
    assertSwapSupport(swapOptions)

    return getTransferInfo({
      api,
      buildTx,
      origin: from,
      destination: to,
      sender,
      recipient,
      ahAddress,
      version,
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
  async getReceivableAmount(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptionsWithSender<TApi, TRes, TSigner>>
  ) {
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

  async getBestAmountOut(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptionsWithSwap<TApi, TRes, TSigner>>
  ) {
    const { swapOptions } = this._options

    return executeWithRouter({ ...this._options, api: this.api, swapOptions }, builder =>
      builder.getBestAmountOut()
    )
  }

  async signAndSubmit(
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >
  ): Promise<string> {
    const { senderSource, swapOptions } = this._options
    assertSenderSource(senderSource)

    if (isViemSigner(senderSource)) {
      return this.executeWithEvmSigner(senderSource)
    }

    if (swapOptions) {
      if (!isSenderSigner(senderSource)) {
        throw new UnsupportedOperationError(
          'Swap operations do not support local accounts yet. Please provider a signer'
        )
      }

      const txHashes = await executeWithRouter(
        { ...this._options, swapOptions, api: this.api },
        builder => builder.signer(senderSource).signAndSubmit()
      )

      return txHashes[0]
    }

    const { tx } = await this.buildInternal()
    return this.api.signAndSubmit(tx, senderSource)
  }

  async signAndSubmitAll(
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >
  ): Promise<string[]> {
    const { senderSource, swapOptions } = this._options
    assertSenderSource(senderSource)

    if (isViemSigner(senderSource)) {
      const hash = await this.executeWithEvmSigner(senderSource)
      return [hash]
    }

    if (swapOptions) {
      if (!isSenderSigner(senderSource)) {
        throw new UnsupportedOperationError(
          'Swap operations do not support local accounts yet. Please provider a signer'
        )
      }

      return executeWithRouter({ ...this._options, swapOptions, api: this.api }, builder =>
        builder.signer(senderSource).signAndSubmit()
      )
    }

    const { tx } = await this.buildInternal()
    const txHash = await this.api.signAndSubmit(tx, senderSource)
    return [txHash]
  }

  private async executeWithEvmSigner(
    this: GeneralBuilder<TApi, TRes, TSigner, TTransferBaseOptionsWithSender<TApi, TRes, TSigner>>,
    signer: WalletClient
  ): Promise<string> {
    const { from, to, currency, recipient, ahAddress } = this._options
    assertToIsString(to)
    assertAddressIsString(recipient)

    return getEvmExtensionOrThrow().executeEvmTransfer({
      api: this.api,
      from,
      to,
      currency,
      recipient,
      ahAddress,
      signer
    })
  }

  /**
   * Returns the API instance used by the builder.
   *
   * @returns The API instance.
   */
  getApi() {
    return this.api.api
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
export const Builder = <TApi, TRes, TSigner>(api: PolkadotApi<TApi, TRes, TSigner>) =>
  new GeneralBuilder(api, new BatchTransactionManager())
