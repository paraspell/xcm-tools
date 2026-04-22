// Implements general builder pattern, this is Builder main file

import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import { type TCurrencyInput, type TCurrencyInputWithAmount } from '@paraspell/assets'
import {
  isExternalChain,
  type TChain,
  type TSubstrateChain,
  type Version
} from '@paraspell/sdk-common'
import type { WalletClient } from 'viem'

import type { PolkadotApi } from '../api/PolkadotApi'
import {
  BatchValidationError,
  DryRunFailedError,
  InvalidAddressError,
  UnableToComputeError,
  UnsupportedOperationError
} from '../errors'
import { getEvmExtensionOrThrow, getEvmSnowbridgeExtensionOrThrow } from '../extensions'
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
  TSubstrateTransferBaseOptions,
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
  assertNotEvmTransfer,
  assertSender,
  assertSenderSource,
  assertSubstrateOrigin,
  assertSwapSupport,
  assertToIsString,
  createTransferOrSwap,
  createTransferOrSwapAll,
  createTxOverrideAmount,
  executeWithRouter,
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
  from(chain: TChain): GeneralBuilder<TApi, TRes, TSigner, T & { from: TChain }> {
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
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptions<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >
  ): GeneralBuilder<TApi, TRes, TSigner, T & { from: TSubstrateChain }> {
    const { from, senderSource } = this._options
    assertNotEvmTransfer(from, senderSource)
    this.batchManager.addTransaction({
      api: this.api,
      ...this._options,
      from,
      builder: this
    })

    return new GeneralBuilder<TApi, TRes, TSigner, T & { from: TSubstrateChain }>(
      this.api,
      this.batchManager,
      { ...this._options, from } as T & { from: TSubstrateChain }
    )
  }

  /**
   * Builds and returns the batched transaction based on the configured parameters.
   *
   * @param options - (Optional) Options to customize the batch transaction.
   * @returns A Extrinsic representing the batched transactions.
   */
  async buildBatch(
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptions<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >,
    options?: TBatchOptions
  ) {
    const { from, senderSource } = this._options
    assertNotEvmTransfer(from, senderSource)
    return this.batchManager.buildBatch(this.api, from, options)
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
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptions<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >
  ): Promise<TRes> {
    const { from, senderSource } = this._options
    assertNotEvmTransfer(from, senderSource)
    const { tx } = await this.buildCommon()
    return tx
  }

  /**
   * Builds and returns multiple transfer or swap extrinsics
   *
   * @returns A Promise that resolves to the transfer extrinsic contexts
   */
  async buildAll(
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptions<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >
  ): Promise<TTransactionContext<TApi, TRes>[]> {
    const { from, senderSource } = this._options
    assertNotEvmTransfer(from, senderSource)
    const { txContexts } = await this.buildCommonAll()
    return txContexts
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
    const { from } = normalizedOptions
    assertSubstrateOrigin(from)
    const substrateOptions = { ...normalizedOptions, from }

    const tx = await createTransferOrSwap(substrateOptions)

    await this.maybePerformXcmFormatCheck(tx, substrateOptions, isCalledInternally)

    return { tx, options: normalizedOptions }
  }

  private async buildCommonAll<TOptions extends TTransferBaseOptions<TApi, TRes, TSigner>>(
    this: GeneralBuilder<TApi, TRes, TSigner, TOptions>,
    isCalledInternally = false
  ): Promise<TBuildAllInternalRes<TApi, TRes, TSigner, TOptions>> {
    this.validateBatchState(isCalledInternally)

    const { normalizedOptions } = await this.prepareNormalizedOptions(this._options)
    const { from } = normalizedOptions
    assertSubstrateOrigin(from)
    const substrateOptions = { ...normalizedOptions, from }

    const txContexts = await createTransferOrSwapAll(substrateOptions)

    return { txContexts, options: normalizedOptions }
  }

  private async maybePerformXcmFormatCheck(
    tx: TRes,
    options: TSubstrateTransferBaseOptions<TApi, TRes, TSigner>,
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
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >
  ): Promise<TDryRunResult> {
    const { from, senderSource, swapOptions } = this._options
    assertNotEvmTransfer(from, senderSource)

    if (swapOptions) {
      return executeWithRouter({ ...this._options, from, api: this.api, swapOptions }, builder =>
        builder.dryRun()
      )
    }

    const { tx, options } = await this.buildInternal()
    return buildDryRun(this.api, tx, { ...options, from })
  }

  async dryRunPreview(
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >,
    dryRunOptions?: TDryRunPreviewOptions
  ) {
    const { from, senderSource, swapOptions } = this._options
    assertNotEvmTransfer(from, senderSource)
    assertSwapSupport(swapOptions)

    const { tx, options } = await this.buildInternal()
    return buildDryRun(
      this.api,
      tx,
      { ...options, from },
      {
        sentAssetMintMode: 'preview',
        mintFeeAssets: dryRunOptions?.mintFeeAssets
      }
    )
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
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >,
    options?: TGetXcmFeeBuilderOptions & { disableFallback: TDisableFallback }
  ): Promise<TGetXcmFeeResult<TDisableFallback>> {
    const disableFallback = (options?.disableFallback ?? false) as TDisableFallback

    const { senderSource } = this._options
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, sender, recipient, currency, feeAsset, version, swapOptions } =
      normalizedOptions

    assertToIsString(to)
    assertAddressIsString(recipient)
    assertNotEvmTransfer(from, senderSource)

    if (swapOptions) {
      return executeWithRouter({ ...normalizedOptions, from, swapOptions }, builder =>
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
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >,
    { disableFallback }: TGetXcmFeeBuilderOptions = { disableFallback: false }
  ) {
    const { senderSource } = this._options
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, sender, currency, feeAsset, version, swapOptions } = normalizedOptions

    assertToIsString(to)
    assertSwapSupport(swapOptions)
    assertNotEvmTransfer(from, senderSource)

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
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >
  ) {
    const { senderSource } = this._options
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, sender, currency, feeAsset, version, swapOptions } = normalizedOptions

    assertToIsString(to)
    assertNotEvmTransfer(from, senderSource)

    if (swapOptions) {
      return executeWithRouter({ ...normalizedOptions, from, swapOptions }, builder =>
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
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >
  ) {
    const { senderSource } = this._options
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, sender, recipient, currency, feeAsset, version, swapOptions } =
      normalizedOptions

    assertToIsString(to)
    assertAddressIsString(recipient)
    assertNotEvmTransfer(from, senderSource)

    if (swapOptions) {
      return executeWithRouter({ ...normalizedOptions, from, swapOptions }, builder =>
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
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >
  ) {
    const { senderSource } = this._options
    const { normalizedOptions, buildTx } = await this.prepareNormalizedOptions(this._options)

    const { api, from, to, sender, recipient, currency, feeAsset, version, swapOptions } =
      normalizedOptions

    assertToIsString(to)
    assertAddressIsString(recipient)
    assertSwapSupport(swapOptions)
    assertNotEvmTransfer(from, senderSource)

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
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >
  ) {
    const { senderSource } = this._options
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
    assertNotEvmTransfer(from, senderSource)

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
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >
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
    this: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSwap<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
    >
  ) {
    const { from, senderSource, swapOptions } = this._options
    assertNotEvmTransfer(from, senderSource)

    return executeWithRouter({ ...this._options, from, api: this.api, swapOptions }, builder =>
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
    const { from, senderSource, swapOptions } = this._options
    assertSenderSource(senderSource)

    if (isViemSigner(senderSource)) {
      return this.executeWithEvmSigner(senderSource)
    }

    assertSubstrateOrigin(from)

    if (swapOptions) {
      if (!isSenderSigner(senderSource)) {
        throw new UnsupportedOperationError(
          'Swap operations do not support local accounts yet. Please provider a signer'
        )
      }

      const txHashes = await executeWithRouter(
        { ...this._options, from, swapOptions, api: this.api },
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
    const { from, senderSource, swapOptions } = this._options
    assertSenderSource(senderSource)

    if (isViemSigner(senderSource)) {
      const hash = await this.executeWithEvmSigner(senderSource)
      return [hash]
    }

    assertSubstrateOrigin(from)

    if (swapOptions) {
      if (!isSenderSigner(senderSource)) {
        throw new UnsupportedOperationError(
          'Swap operations do not support local accounts yet. Please provider a signer'
        )
      }

      return executeWithRouter({ ...this._options, from, swapOptions, api: this.api }, builder =>
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

    if (isExternalChain(from)) {
      return getEvmSnowbridgeExtensionOrThrow().executeEvmSnowbridgeTransfer({
        api: this.api,
        from,
        to,
        currency,
        recipient,
        ahAddress,
        signer
      })
    }

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
