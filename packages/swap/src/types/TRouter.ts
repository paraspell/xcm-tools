import type { TPapiApi } from '@paraspell/sdk';
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
import type { Extrinsic, TPjsApi } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';

export type TSwapOptions<TApi, TRes, TSigner> = {
  apiPjs: ApiPromise;
  api: PolkadotApi<TApi, TRes, TSigner>;
  assetFrom: TAssetInfo;
  assetTo: TAssetInfo;
  amount: bigint;
  slippagePct: string;
  sender: string;
  feeCalcAddress: string;
  origin?: TOriginInfo<TApi>;
  isForFeeEstimation?: boolean;
};

export type TGetAmountOutOptions<TApi, TRes, TSigner> = {
  apiPjs: ApiPromise;
  api: PolkadotApi<TApi, TRes, TSigner>;
  origin?: TOriginInfo<TApi>;
  assetFrom: TAssetInfo;
  assetTo: TAssetInfo;
  amount: bigint;
  slippagePct?: string;
};

export type TExtrinsic<TRes> = Extrinsic | TRes;

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

export type TTransferOptions<TApi, TRes, TSigner> = WithApi<
  TTransferBaseOptions<TApi, TRes, TSigner>,
  TApi,
  TRes,
  TSigner
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

export type TGetBestAmountOutOptions<TApi, TRes, TSigner> = WithApi<
  TGetBestAmountOutBaseOptions<TApi, TRes, TSigner>,
  TApi,
  TRes,
  TSigner
>;

export type TGetBestAmountOutResult = {
  exchange: TExchangeChain;
  amountOut: bigint;
};

export type TBuildTransactionsBaseOptions<TApi, TRes, TSigner> = Omit<
  TTransferBaseOptions<TApi, TRes, TSigner>,
  'onStatusChange' | 'signer' | 'evmSigner'
>;

export type TBuildTransactionsOptions<TApi, TRes, TSigner> = WithApi<
  TBuildTransactionsBaseOptions<TApi, TRes, TSigner>,
  TApi,
  TRes,
  TSigner
>;

export type TCommonRouterOptions<TApi, TRes, TSigner> =
  | TTransferOptions<TApi, TRes, TSigner>
  | TBuildTransactionsOptions<TApi, TRes, TSigner>;

export type TTransformedOptions<T, TApi, TRes, TSigner> = Omit<T, 'exchange' | 'amount'> &
  WithApi<TAdditionalTransferOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>;

export type TOriginInfo<TApi> = {
  api: TApi;
  chain: TSubstrateChain;
  assetFrom: TAssetInfo;
  feeAssetInfo?: TAssetInfo;
};

export type TExchangeInfo<TApi, TRes, TSigner> = {
  apiPjs: TPjsApi;
  apiPapi: TPapiApi;
  api: PolkadotApi<TApi, TRes, TSigner>;
  chain: TExchangeChain;
  assetFrom: TAssetInfo;
  assetTo: TAssetInfo;
  feeAssetInfo?: TAssetInfo;
};

export type TDestinationInfo = {
  chain: TChain;
  address: string;
};

export type TAdditionalTransferOptions<TApi, TRes, TSigner> = {
  amount: bigint;
  origin?: TOriginInfo<TApi>;
  exchange: TExchangeInfo<TApi, TRes, TSigner>;
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

export type TExecuteRouterPlanOptions<TApi, TRes, TSigner> = {
  signer: TSigner;
  sender: string;
  destination?: TChain;
  evmSigner?: TSigner;
  evmSenderAddress?: string;
  onStatusChange?: TStatusChangeCallback<TApi, TRes>;
  api: PolkadotApi<TApi, TRes, TSigner>;
};

export type TPreparedExtrinsics<TRes> = {
  toExchangeTx?: TRes;
  swapTxs: TRes[];
  isExecute?: boolean;
  toDestTx?: TRes;
  amountOut: bigint;
};

export type TBuildToExchangeTxOptions<TApi, TRes, TSigner> = {
  origin: TOriginInfo<TApi>;
  exchange: TExchangeInfo<TApi, TRes, TSigner>;
  sender: string;
  evmSenderAddress?: string;
  amount: bigint;
  api: PolkadotApi<TApi, TRes, TSigner>;
};

export type TBuildFromExchangeTxOptions<TApi, TRes, TSigner> = {
  exchange: TExchangeInfo<TApi, TRes, TSigner>;
  destination: TDestinationInfo;
  amount: bigint;
  sender: string;
  api: PolkadotApi<TApi, TRes, TSigner>;
};
