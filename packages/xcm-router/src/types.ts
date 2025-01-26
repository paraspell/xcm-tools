import type {
  Extrinsic,
  TAsset as SdkTAsset,
  TNodePolkadotKusama,
  TCurrencyCoreV1,
  TNodeDotKsmWithRelayChains,
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

export enum TransactionType {
  TO_EXCHANGE = 'TO_EXCHANGE',
  SWAP = 'SWAP',
  TO_DESTINATION = 'TO_DESTINATION',
  FULL_TRANSFER = 'FULL_TRANSFER',
}

/**
 * The transaction progress information.
 */
export interface TTxProgressInfo {
  /**
   * When true the exchange will be selected automatically.
   */
  isAutoSelectingExchange?: boolean;
  /**
   * The currently executed transaction type.
   */
  type: TransactionType;
  /**
   * The transaction hashes grouped by transaction type.
   */
  hashes?: {
    [TransactionType.TO_EXCHANGE]?: string;
    [TransactionType.SWAP]?: string;
    [TransactionType.TO_DESTINATION]?: string;
  };
  /**
   * The current transaction status. Either 'IN_PROGRESS' or 'SUCCESS'.
   */
  status: TransactionStatus;
}

export enum TransactionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
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
   * The destination node to transfer to.
   */
  to: TNodeDotKsmWithRelayChains;
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
   * The exchange node to use for the transfer.
   */
  exchange?: TExchangeNode;
  /**
   * The callback function to call when the transaction status changes.
   */
  onStatusChange?: (info: TTxProgressInfo) => void;
  /**
   * Execute only the specific part of the transfer. Used for debugging and testing purposes.
   */
  type?: TransactionType;
}

export type TBuildTransferExtrinsicsOptions = Omit<
  TTransferOptions,
  'onStatusChange' | 'signer' | 'evmSigner'
>;

export type TTransferOptionsModified = Omit<TTransferOptions, 'exchange'> & {
  exchangeNode: TNodePolkadotKusama;
  exchange: TExchangeNode;
  assetFrom?: SdkTAsset;
  assetTo?: SdkTAsset;
  feeCalcAddress: string;
};

export type TCommonTransferOptions = Omit<TTransferOptions, 'signer'>;
export type TCommonTransferOptionsModified = Omit<TTransferOptionsModified, 'signer'>;

export type TAsset = {
  symbol: string;
  id?: string;
};
export type TAssets = Array<TAsset>;
export type TAssetsRecord = Record<TExchangeNode, TAssets>;

export type TBasicInfo = {
  node: TNodeDotKsmWithRelayChains;
  statusType: TransactionType;
  wsProvider?: string;
};

export type TExtrinsicInfo = TBasicInfo & {
  tx: Extrinsic;
  type: 'EXTRINSIC';
};

export type TBuildTransferExtrinsicsResult = TExtrinsicInfo[];

export type TAutoSelect = 'Auto select';
