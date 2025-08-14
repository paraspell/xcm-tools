import type {
  TAssetInfo,
  TChain,
  TCurrencyInput,
  TLocation,
  TPapiApi,
  TPapiTransaction,
  TParachain,
  TSubstrateChain,
} from '@paraspell/sdk';
import type { Extrinsic, TPjsApi } from '@paraspell/sdk-pjs';
import type { PolkadotSigner } from 'polkadot-api';

import type { EXCHANGE_CHAINS } from '../consts';

export type TExchangeChain = (typeof EXCHANGE_CHAINS)[number];

export type TSwapOptions = {
  papiApi: TPapiApi;
  assetFrom: TRouterAsset;
  assetTo: TRouterAsset;
  amount: string;
  slippagePct: string;
  senderAddress: string;
  feeCalcAddress: string;
  origin?: TOriginInfo;
};

export type TGetAmountOutOptions = {
  papiApi: TPapiApi;
  origin?: TOriginInfo;
  assetFrom: TRouterAsset;
  assetTo: TRouterAsset;
  amount: string;
  slippagePct?: string;
};

export type TExtrinsic = Extrinsic | TPapiTransaction;

export type TSingleSwapResult = {
  tx: TExtrinsic;
  amountOut: string;
};

export type TMultiSwapResult = {
  txs: TExtrinsic[];
  amountOut: string;
};

export type TRouterEventType = TTransactionType | 'SELECTING_EXCHANGE' | 'COMPLETED';

/**
 * The transaction progress information.
 */
export type TRouterEvent = {
  /**
   * Current execution phase type
   */
  type: TRouterEventType;
  /**
   * Full transaction plan for visualization
   */
  routerPlan?: TRouterPlan;
  /**
   * Current transaction's origin chain
   */
  chain?: TSubstrateChain;
  /**
   * Current transaction's destination chain
   */
  destinationChain?: TChain;
  /**
   * 0-based step index of current operation
   */
  currentStep?: number;
};

export type TStatusChangeCallback = (info: TRouterEvent) => void;

/**
 * The options for an XCM Router transfer.
 */
export type TTransferOptions = {
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
  amount: string;
  /**
   * The sender address.
   */
  senderAddress: string;
  /**
   * The EVM injector address. Used when dealing with EVM chains.
   */
  evmSenderAddress?: string;
  /**
   * The recipient address.
   */
  recipientAddress?: string;
  /**
   * The slippage percentage.
   */
  slippagePct: string;
  /**
   * The Polkadot signer instance.
   */
  signer: PolkadotSigner;
  /**
   * The Polkadot EVM signer instance.
   */
  evmSigner?: PolkadotSigner;

  /**
   * The callback function to call when the transaction status changes.
   */
  onStatusChange?: TStatusChangeCallback;
};

export type TGetBestAmountOutOptions = Omit<
  TTransferOptions,
  | 'onStatusChange'
  | 'signer'
  | 'evmSigner'
  | 'recipientAddress'
  | 'slippagePct'
  | 'senderAddress'
  | 'evmSenderAddress'
>;

export type TGetBestAmountOutResult = {
  exchange: TExchangeChain;
  amountOut: bigint;
};

export type TBuildTransactionsOptions = Omit<
  TTransferOptions,
  'onStatusChange' | 'signer' | 'evmSigner'
>;

export type TBuildTransactionsOptionsModified = Omit<TBuildTransactionsOptions, 'exchange'> &
  TAdditionalTransferOptions;

export type TOriginInfo = {
  api: TPapiApi;
  chain: TSubstrateChain;
  assetFrom: TAssetInfo;
};

export type TExchangeInfo = {
  api: TPjsApi;
  apiPapi: TPapiApi;
  baseChain: TParachain;
  exchangeChain: TExchangeChain;
  assetFrom: TRouterAsset;
  assetTo: TRouterAsset;
};

export type TDestinationInfo = {
  chain: TChain;
  address: string;
};

export type TAdditionalTransferOptions = {
  origin?: TOriginInfo;
  exchange: TExchangeInfo;
  destination?: TDestinationInfo;
  feeCalcAddress: string;
};

export type TTransferOptionsModified = Omit<TTransferOptions, 'exchange'> &
  TAdditionalTransferOptions;

export type TCommonTransferOptions = Omit<TTransferOptions, 'signer'>;
export type TCommonTransferOptionsModified = Omit<TTransferOptionsModified, 'signer'>;

export type TRouterAsset = {
  symbol: string;
  decimals: number;
  assetId?: string;
  location?: TLocation;
};

export type TPairKey = string | object;

export type TPairs = TPairKey[][];

export type TDexConfig = {
  assets: TRouterAsset[];
  isOmni: boolean;
  pairs: TPairs;
};

export type TAssetsRecord = Record<TExchangeChain, TDexConfig>;

export type TExchangeInput =
  | TExchangeChain
  | [TExchangeChain, TExchangeChain, ...TExchangeChain[]]
  | undefined;

export type TTransactionType = 'TRANSFER' | 'SWAP' | 'SWAP_AND_TRANSFER';

type TBaseTransaction = {
  api: TPapiApi;
  chain: TSubstrateChain;
  destinationChain?: TChain;
  tx: TPapiTransaction;
};

export type TSwapTransaction = TBaseTransaction & {
  type: 'SWAP';
  amountOut: bigint;
};

export type TNonSwapTransaction = TBaseTransaction & {
  type: 'TRANSFER' | 'SWAP_AND_TRANSFER';
};

export type TTransaction = TSwapTransaction | TNonSwapTransaction;

export type TRouterPlan = TTransaction[];

export type TExecuteRouterPlanOptions = {
  signer: PolkadotSigner;
  senderAddress: string;
  destination?: TChain;
  evmSigner?: PolkadotSigner;
  evmSenderAddress?: string;
  onStatusChange?: TStatusChangeCallback;
};

export type TPreparedExtrinsics = {
  toExchangeTx?: TPapiTransaction;
  swapTxs: TPapiTransaction[];
  isExecute?: boolean;
  toDestTx?: TPapiTransaction;
  amountOut: bigint;
};

export type TBuildToExchangeTxOptions = {
  origin: TOriginInfo;
  exchange: TExchangeInfo;
  senderAddress: string;
  evmSenderAddress?: string;
  amount: string;
};

export type TBuildFromExchangeTxOptions = {
  exchange: TExchangeInfo;
  destination: TDestinationInfo;
  amount: string;
  senderAddress: string;
};
