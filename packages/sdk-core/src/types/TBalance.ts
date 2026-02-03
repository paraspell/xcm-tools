import type { TAssetInfo, TCurrencyCore, TCurrencyInput, WithAmount } from '@paraspell/assets'
import type { TChain, TSubstrateChain, Version } from '@paraspell/sdk-common'

import type { GeneralBuilder } from '../builder'
import type { WithApi } from './TApi'
import type { TSendBaseOptionsWithSenderAddress } from './TTransfer'
import type { TTxFactory } from './TXcmFee'

export type TGetBalanceCommonOptions = {
  /**
   * The address of the account.
   */
  address: string
  /**
   * The chain on which to query the balance.
   */
  chain: TChain
}

/**
 * Retrieves the asset balance for a given account on a specified chain.
 */
export type TGetAssetBalanceOptionsBase = TGetBalanceCommonOptions & {
  /**
   * The resolved asset to query balance for.
   */
  asset: TAssetInfo
}

/**
 * Retrieves the currency balance for a given account on a specified chain.
 */
export type TGetBalanceOptionsBase = TGetBalanceCommonOptions & {
  /**
   * The currency to query.
   */
  currency?: TCurrencyCore
}

export type TGetBalanceOptions<TApi, TRes, TSigner> = WithApi<
  TGetBalanceOptionsBase,
  TApi,
  TRes,
  TSigner
>
export type TGetAssetBalanceOptions<TApi, TRes, TSigner> = WithApi<
  TGetAssetBalanceOptionsBase,
  TApi,
  TRes,
  TSigner
>

export type TGetTransferableAmountOptionsBase<TRes> = {
  /**
   * The sender address of the account.
   */
  senderAddress: string
  /**
   * The chain on which to query the balance.
   */
  origin: TSubstrateChain
  /**
   * The destination chain.
   */
  destination: TChain
  /**
   * The currency to query.
   */
  currency: WithAmount<TCurrencyCore>
  version: Version | undefined
  buildTx: TTxFactory<TRes>
  feeAsset?: TCurrencyInput
}

export type TGetTransferableAmountOptions<TApi, TRes, TSigner> = WithApi<
  TGetTransferableAmountOptionsBase<TRes>,
  TApi,
  TRes,
  TSigner
>

export type TGetMinTransferableAmountOptions<TApi, TRes, TSigner> = WithApi<
  TGetTransferableAmountOptionsBase<TRes> & {
    address: string
    builder: GeneralBuilder<TApi, TRes, TSigner, TSendBaseOptionsWithSenderAddress<TRes>>
  },
  TApi,
  TRes,
  TSigner
>

export type TVerifyEdOnDestinationOptionsBase<TRes> = {
  /**
   * The origin chain.
   */
  origin: TSubstrateChain
  /**
   * The destination chain.
   */
  destination: TChain
  /**
   * The address of the account.
   */
  address: string
  /**
   * The account of the sender.
   */
  senderAddress: string
  /**
   * The currency to query.
   */
  currency: WithAmount<TCurrencyCore>
  version: Version | undefined
  buildTx: TTxFactory<TRes>
  feeAsset?: TCurrencyInput
}

export type TVerifyEdOnDestinationOptions<TApi, TRes, TSigner> = WithApi<
  TVerifyEdOnDestinationOptionsBase<TRes>,
  TApi,
  TRes,
  TSigner
>
