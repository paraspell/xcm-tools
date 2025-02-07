import type {
  Extrinsic,
  TAsset as SdkTAsset,
  TNodePolkadotKusama,
  TNodeDotKsmWithRelayChains,
  TPjsApi,
  TNodeWithRelayChains,
  TCurrencyInput,
} from '@paraspell/sdk-pjs';
import { type Signer } from '@polkadot/types/types';
import { type EXCHANGE_NODES } from './consts';
import type BigNumber from 'bignumber.js';

export type TExchangeNode = (typeof EXCHANGE_NODES)[number];

export type TSwapOptions = {
  assetFrom: SdkTAsset;
  assetTo: SdkTAsset;
  amount: string;
  slippagePct: string;
  senderAddress: string;
  feeCalcAddress: string;
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

export type TBuildTransactionsOptions = Omit<
  TTransferOptions,
  'onStatusChange' | 'signer' | 'evmSigner'
>;

export type TBuildTransactionsOptionsModified = Omit<TBuildTransactionsOptions, 'exchange'> &
  TAdditionalTransferOptions;

export type TAdditionalTransferOptions = {
  origin?: {
    api: TPjsApi;
    node: TNodeDotKsmWithRelayChains;
    assetFrom: SdkTAsset;
  };
  exchange: {
    api: TPjsApi;
    baseNode: TNodePolkadotKusama;
    exchangeNode: TExchangeNode;
    assetFrom: TRouterAsset;
    assetTo: TRouterAsset;
  };
  destination?: {
    node: TNodeWithRelayChains;
    address: string;
  };
  feeCalcAddress: string;
};

export type TWeight = {
  refTime: BigNumber;
  proofSize: BigNumber;
};

export type TTransferOptionsModified = Omit<TTransferOptions, 'exchange'> &
  TAdditionalTransferOptions;

export type TCommonTransferOptions = Omit<TTransferOptions, 'signer'>;
export type TCommonTransferOptionsModified = Omit<TTransferOptionsModified, 'signer'>;

export type TRouterAsset = {
  symbol: string;
  id?: string;
};
export type TAssets = Array<TRouterAsset>;
export type TAssetsRecord = Record<TExchangeNode, TAssets>;

export type TAutoSelect = 'Auto select';

export type TTransactionType = 'TRANSFER' | 'SWAP' | 'SWAP_AND_TRANSFER';

export type TTransaction = {
  api: TPjsApi;
  node: TNodeDotKsmWithRelayChains;
  destinationNode?: TNodeWithRelayChains;
  type: TTransactionType;
  tx: Extrinsic;
};

export type TRouterPlan = TTransaction[];

export type TExecuteRouterPlanOptions = {
  signer: Signer;
  senderAddress: string;
  destination?: TNodeWithRelayChains;
  evmSigner?: Signer;
  evmSenderAddress?: string;
  onStatusChange?: TStatusChangeCallback;
};
