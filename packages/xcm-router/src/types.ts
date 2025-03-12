import type {
  Extrinsic,
  TAsset,
  TCurrencyInput,
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  TNodeWithRelayChains,
  TPjsApi,
} from '@paraspell/sdk-pjs';
import { type Signer } from '@polkadot/types/types';

import { type EXCHANGE_NODES } from './consts';

export type TExchangeNode = (typeof EXCHANGE_NODES)[number];

export type TSwapOptions = {
  assetFrom: TRouterAsset;
  assetTo: TRouterAsset;
  amount: string;
  slippagePct: string;
  senderAddress: string;
  feeCalcAddress: string;
  origin?: TOriginInfo;
};

export type TGetAmountOutOptions = {
  origin?: TOriginInfo;
  assetFrom: TRouterAsset;
  assetTo: TRouterAsset;
  amount: string;
};

export type TSwapResult = {
  tx: Extrinsic;
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
   * Current transaction's origin node
   */
  node?: TNodeDotKsmWithRelayChains;
  /**
   * Current transaction's destination node
   */
  destinationNode?: TNodeWithRelayChains;
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
   * The origin node to transfer from.
   */
  from?: TNodeDotKsmWithRelayChains;
  /**
   * The exchange node to use for the transfer.
   */
  exchange?: TExchangeNode;
  /**
   * The destination node to transfer to.
   */
  to?: TNodeWithRelayChains;
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
   * The EVM injector address. Used when dealing with EVM nodes.
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
  signer: Signer;
  /**
   * The Polkadot EVM signer instance.
   */
  evmSigner?: Signer;

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
  exchange: TExchangeNode;
  amountOut: bigint;
};

export type TBuildTransactionsOptions = Omit<
  TTransferOptions,
  'onStatusChange' | 'signer' | 'evmSigner'
>;

export type TBuildTransactionsOptionsModified = Omit<TBuildTransactionsOptions, 'exchange'> &
  TAdditionalTransferOptions;

export type TOriginInfo = {
  api: TPjsApi;
  node: TNodeDotKsmWithRelayChains;
  assetFrom: TAsset;
};

export type TExchangeInfo = {
  api: TPjsApi;
  baseNode: TNodePolkadotKusama;
  exchangeNode: TExchangeNode;
  assetFrom: TRouterAsset;
  assetTo: TRouterAsset;
};

export type TDestinationInfo = {
  node: TNodeWithRelayChains;
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
  id?: string;
  multiLocation?: object;
};
export type TAssets = Array<TRouterAsset>;
export type TAssetsRecord = Record<TExchangeNode, TAssets>;

export type TAutoSelect = 'Auto select';

export type TTransactionType = 'TRANSFER' | 'SWAP' | 'SWAP_AND_TRANSFER';

type TBaseTransaction = {
  api: TPjsApi;
  node: TNodeDotKsmWithRelayChains;
  destinationNode?: TNodeWithRelayChains;
  tx: Extrinsic;
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
  signer: Signer;
  senderAddress: string;
  destination?: TNodeWithRelayChains;
  evmSigner?: Signer;
  evmSenderAddress?: string;
  onStatusChange?: TStatusChangeCallback;
};
