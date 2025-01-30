import type {
  Extrinsic,
  TAsset as SdkTAsset,
  TNodePolkadotKusama,
  TCurrencyCoreV1,
  TNodeDotKsmWithRelayChains,
  TPjsApi,
  TNodeWithRelayChains,
} from '@paraspell/sdk-pjs';
import { type Signer } from '@polkadot/types/types';
import { type EXCHANGE_NODES } from './consts';

export type TExchangeNode = (typeof EXCHANGE_NODES)[number];

export interface TSwapOptions {
  currencyFrom: TCurrencyCoreV1;
  currencyTo: TCurrencyCoreV1;
  assetFrom?: SdkTAsset;
  assetTo?: SdkTAsset;
  amount: string;
  slippagePct: string;
  injectorAddress: string;
  feeCalcAddress: string;
}

export interface TSwapResult {
  tx: Extrinsic;
  amountOut: string;
}

export type TRouterEventType = TTransactionType | 'SELECTING_EXCHANGE' | 'COMPLETED';

/**
 * The transaction progress information.
 */
export interface TRouterEvent {
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
}

/**
 * The options for an XCM Router transfer.
 */
export interface TTransferOptions {
  /**
   * The origin node to transfer from.
   */
  from: TNodeDotKsmWithRelayChains;
  /**
   * The exchange node to use for the transfer.
   */
  exchange?: TExchangeNode;
  /**
   * The destination node to transfer to.
   */
  to: TNodeWithRelayChains;
  /**
   * The origin currency.
   */
  currencyFrom: TCurrencyCoreV1;
  /**
   * The destination currency that the origin currency will be exchanged to.
   */
  currencyTo: TCurrencyCoreV1;
  /**
   * The amount to transfer.
   * @example '1000000000000000'
   */
  amount: string;
  /**
   * The injector address.
   */
  injectorAddress: string;
  /**
   * The EVM injector address. Used when dealing with EVM nodes.
   */
  evmInjectorAddress?: string;
  /**
   * The recipient address.
   */
  recipientAddress: string;
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
  onStatusChange?: (info: TRouterEvent) => void;
}

export type TBuildTransactionsOptions = Omit<
  TTransferOptions,
  'onStatusChange' | 'signer' | 'evmSigner'
>;

export type TBuildTransactionsOptionsModified = TBuildTransactionsOptions &
  TAdditionalTransferOptions;

export type TAdditionalTransferOptions = {
  exchangeNode: TNodePolkadotKusama;
  exchange: TExchangeNode;
  assetFrom?: SdkTAsset;
  assetTo?: SdkTAsset;
  feeCalcAddress: string;
};

export type TTransferOptionsModified = Omit<TTransferOptions, 'exchange'> &
  TAdditionalTransferOptions;

export type TCommonTransferOptions = Omit<TTransferOptions, 'signer'>;
export type TCommonTransferOptionsModified = Omit<TTransferOptionsModified, 'signer'>;

export type TAsset = {
  symbol: string;
  id?: string;
};
export type TAssets = Array<TAsset>;
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
  evmSigner?: Signer;
  evmSenderAddress?: string;
  onStatusChange?: (info: TRouterEvent) => void;
};
