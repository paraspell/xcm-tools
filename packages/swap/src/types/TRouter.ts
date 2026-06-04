import type { TPapiApi, TPapiTransaction } from '@paraspell/sdk';
import type {
  TAmount,
  TAssetInfo,
  TChain,
  TCurrencyInput,
  TExchangeChain,
  TExchangeInput,
  TLocation,
  TStatusChangeCallback,
  TSubstrateChain,
  WithApi,
} from '@paraspell/sdk-core';
import type { PolkadotApi } from '@paraspell/sdk-core';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';

export type TExchangeApiType = 'PJS' | 'PAPI' | 'GENERIC';

export type TExchangeApiVariant =
  | { apiType: 'PJS'; apiPjs: ApiPromise }
  | { apiType: 'PAPI'; apiPapi: TPapiApi }
  | { apiType: 'GENERIC' };

export type TGetDexConfigApi<TApiType extends TExchangeApiType> = TApiType extends 'PJS'
  ? ApiPromise
  : TPapiApi;

type WithApiVariant<TBase, TApiType extends TExchangeApiType = TExchangeApiType> = TBase &
  Extract<TExchangeApiVariant, { apiType: TApiType }>;

type TSwapOptionsCommon<TApi, TRes, TSigner, TCustomChain extends string = never> = {
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>;
  assetFrom: TAssetInfo;
  assetTo: TAssetInfo;
  amount: bigint;
  slippagePct: string;
  sender: string;
  feeCalcAddress: string;
  origin?: TOriginInfo<TApi>;
  isForFeeEstimation?: boolean;
};

export type TSwapOptions<TApi, TRes, TSigner, TCustomChain extends string = never> = WithApiVariant<
  TSwapOptionsCommon<TApi, TRes, TSigner, TCustomChain>
>;

export type TSwapOptionsFor<
  TApi,
  TRes,
  TSigner,
  TApiType extends TExchangeApiType,
  TCustomChain extends string = never,
> = WithApiVariant<TSwapOptionsCommon<TApi, TRes, TSigner, TCustomChain>, TApiType>;

export type TPjsSwapOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
> = TSwapOptionsFor<TApi, TRes, TSigner, 'PJS', TCustomChain>;
export type TPapiSwapOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
> = TSwapOptionsFor<TApi, TRes, TSigner, 'PAPI', TCustomChain>;
export type TGenericSwapOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
> = TSwapOptionsFor<TApi, TRes, TSigner, 'GENERIC', TCustomChain>;

type TGetAmountOutOptionsCommon<TApi, TRes, TSigner, TCustomChain extends string = never> = {
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>;
  origin?: TOriginInfo<TApi>;
  assetFrom: TAssetInfo;
  assetTo: TAssetInfo;
  amount: bigint;
  slippagePct?: string;
};

export type TGetAmountOutOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
> = WithApiVariant<TGetAmountOutOptionsCommon<TApi, TRes, TSigner, TCustomChain>>;

export type TGetAmountOutOptionsFor<
  TApi,
  TRes,
  TSigner,
  TApiType extends TExchangeApiType,
  TCustomChain extends string = never,
> = WithApiVariant<TGetAmountOutOptionsCommon<TApi, TRes, TSigner, TCustomChain>, TApiType>;

export type TPjsGetAmountOutOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
> = TGetAmountOutOptionsFor<TApi, TRes, TSigner, 'PJS', TCustomChain>;
export type TPapiGetAmountOutOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
> = TGetAmountOutOptionsFor<TApi, TRes, TSigner, 'PAPI', TCustomChain>;
export type TGenericGetAmountOutOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
> = TGetAmountOutOptionsFor<TApi, TRes, TSigner, 'GENERIC', TCustomChain>;

export type TExtrinsic<TRes> = Extrinsic | TPapiTransaction | TRes;

export type TSingleSwapResult<TRes> = {
  tx: TExtrinsic<TRes>;
  amountOut: bigint;
};

export type TMultiSwapResult<TRes> = {
  txs: TExtrinsic<TRes>[];
  amountOut: bigint;
};

/**
 * The options for an XCM Router transfer.
 */
export type TTransferBaseOptions<TApi, TRes, TSigner> = {
  /**
   * The origin chain to transfer from.
   */
  from?: TSubstrateChain;
  /**
   * The exchange chain to use for the transfer.
   */
  exchange?: TExchangeInput;
  /**
   * The destination chain to transfer to.
   */
  to?: TChain;
  /**
   * The origin currency.
   */
  currencyFrom: TCurrencyInput;
  /**
   * The destination currency that the origin currency will be exchanged to.
   */
  currencyTo: TCurrencyInput;
  /**
   * The amount to transfer.
   * @example '1000000000000000'
   */
  amount: TAmount;
  /**
   * The sender address.
   */
  sender: string;
  /**
   * The EVM injector address. Used when dealing with EVM chains.
   */
  evmSenderAddress?: string;
  /**
   * The recipient address.
   */
  recipient?: string;
  /**
   * The slippage percentage.
   */
  slippagePct: string;
  /**
   * The signer instance.
   */
  signer: TSigner;
  /**
   * The EVM signer instance.
   */
  evmSigner?: TSigner;

  /**
   * The asset used to pay XCM fees.
   */
  feeAsset?: TCurrencyInput;

  /**
   * The callback function to call when the transaction status changes.
   */
  onStatusChange?: TStatusChangeCallback<TApi, TRes>;
};

export type TTransferOptions<TApi, TRes, TSigner, TCustomChain extends string = never> = WithApi<
  TTransferBaseOptions<TApi, TRes, TSigner>,
  TApi,
  TRes,
  TSigner,
  TCustomChain
>;

export type TGetBestAmountOutBaseOptions<TApi, TRes, TSigner> = Omit<
  TTransferBaseOptions<TApi, TRes, TSigner>,
  | 'onStatusChange'
  | 'signer'
  | 'evmSigner'
  | 'recipient'
  | 'slippagePct'
  | 'sender'
  | 'evmSenderAddress'
>;

export type TGetBestAmountOutOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
> = WithApi<TGetBestAmountOutBaseOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner, TCustomChain>;

export type TGetBestAmountOutResult = {
  exchange: TExchangeChain;
  amountOut: bigint;
};

export type TBuildTransactionsBaseOptions<TApi, TRes, TSigner> = Omit<
  TTransferBaseOptions<TApi, TRes, TSigner>,
  'onStatusChange' | 'signer' | 'evmSigner'
>;

export type TBuildTransactionsOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
> = WithApi<TBuildTransactionsBaseOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner, TCustomChain>;

export type TCommonRouterOptions<TApi, TRes, TSigner, TCustomChain extends string = never> =
  | TTransferOptions<TApi, TRes, TSigner, TCustomChain>
  | TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>;

export type TTransformedOptions<T, TApi, TRes, TSigner, TCustomChain extends string = never> = Omit<
  T,
  'exchange' | 'amount'
> &
  WithApi<
    TAdditionalTransferOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >;

export type TOriginInfo<TApi> = {
  api: TApi;
  chain: TSubstrateChain;
  assetFrom: TAssetInfo;
  feeAssetInfo?: TAssetInfo;
};

type TExchangeInfoCommon<TApi, TRes, TSigner, TCustomChain extends string = never> = {
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>;
  chain: TExchangeChain;
  assetFrom: TAssetInfo;
  assetTo: TAssetInfo;
  feeAssetInfo?: TAssetInfo;
};

export type TExchangeInfo<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
> = WithApiVariant<TExchangeInfoCommon<TApi, TRes, TSigner, TCustomChain>>;

export type TExchangeInfoFor<
  TApi,
  TRes,
  TSigner,
  TApiType extends TExchangeApiType,
  TCustomChain extends string = never,
> = WithApiVariant<TExchangeInfoCommon<TApi, TRes, TSigner, TCustomChain>, TApiType>;

export type TPjsExchangeInfo<TApi, TRes, TSigner> = TExchangeInfoFor<TApi, TRes, TSigner, 'PJS'>;
export type TPapiExchangeInfo<TApi, TRes, TSigner> = TExchangeInfoFor<TApi, TRes, TSigner, 'PAPI'>;
export type TGenericExchangeInfo<TApi, TRes, TSigner> = TExchangeInfoFor<
  TApi,
  TRes,
  TSigner,
  'GENERIC'
>;

export type TDestinationInfo = {
  chain: TChain;
  address: string;
};

export type TAdditionalTransferOptions<TApi, TRes, TSigner, TCustomChain extends string = never> = {
  amount: bigint;
  origin?: TOriginInfo<TApi>;
  exchange: TExchangeInfo<TApi, TRes, TSigner, TCustomChain>;
  destination?: TDestinationInfo;
  feeCalcAddress: string;
};

export type TPairs = TLocation[][];

export type TDexConfigBase = {
  isOmni: boolean;
  pairs: TPairs;
};

export type TDexConfig = {
  assets: TAssetInfo[];
} & TDexConfigBase;

export type TDexConfigStored = {
  assets: TLocation[];
} & TDexConfigBase;

export type TAssetsRecord = Record<TExchangeChain, TDexConfigStored>;

type TBaseTransaction<TApi, TRes> = {
  api: TApi;
  chain: TSubstrateChain;
  destinationChain?: TChain;
  tx: TRes;
};

export type TSwapTransaction<TApi, TRes> = TBaseTransaction<TApi, TRes> & {
  type: 'SWAP';
  amountOut: bigint;
};
type TTransferTransaction<TApi, TRes> = TBaseTransaction<TApi, TRes> & {
  type: 'TRANSFER';
};

export type TSwapAndTransferTransaction<TApi, TRes> = TBaseTransaction<TApi, TRes> & {
  type: 'SWAP_AND_TRANSFER';
  amountOut: bigint;
};

export type TTransaction<TApi, TRes> =
  | TSwapTransaction<TApi, TRes>
  | TSwapAndTransferTransaction<TApi, TRes>
  | TTransferTransaction<TApi, TRes>;

export type TRouterPlan<TApi, TRes> = TTransaction<TApi, TRes>[];

export type TExecuteRouterPlanOptions<TApi, TRes, TSigner, TCustomChain extends string = never> = {
  signer: TSigner;
  sender: string;
  destination?: TChain;
  evmSigner?: TSigner;
  evmSenderAddress?: string;
  onStatusChange?: TStatusChangeCallback<TApi, TRes>;
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>;
};

export type TPreparedExtrinsics<TRes> = {
  toExchangeTx?: TRes;
  swapTxs: TRes[];
  isExecute?: boolean;
  toDestTx?: TRes;
  amountOut: bigint;
};

export type TBuildToExchangeTxOptions<TApi, TRes, TSigner, TCustomChain extends string = never> = {
  origin: TOriginInfo<TApi>;
  exchange: TExchangeInfo<TApi, TRes, TSigner, TCustomChain>;
  sender: string;
  evmSenderAddress?: string;
  amount: bigint;
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>;
};

export type TBuildFromExchangeTxOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
> = {
  exchange: TExchangeInfo<TApi, TRes, TSigner, TCustomChain>;
  destination: TDestinationInfo;
  amount: bigint;
  sender: string;
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>;
};

export type TSwapTransformedOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
> = TTransformedOptions<
  TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
  TApi,
  TRes,
  TSigner,
  TCustomChain
>;

export type TCallDexAmountOutOverrides = {
  amount?: bigint;
  assetTo?: TAssetInfo;
  slippagePct?: string;
};

export type TBuildSwapExecuteOverrides = {
  amount?: bigint;
  feeEstimation?: boolean;
};
