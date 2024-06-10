import { type TNodeWithRelayChains, type Extrinsic, type TNode } from '@paraspell/sdk';
import { type Signer } from '@polkadot/types/types';
import { type EXCHANGE_NODES } from './consts/consts';

export type TExchangeNode = (typeof EXCHANGE_NODES)[number];

export interface TSwapOptions {
  currencyFrom: string;
  currencyTo: string;
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

export interface TTxProgressInfo {
  isAutoSelectingExchange?: boolean;
  type: TransactionType;
  hashes?: {
    [TransactionType.TO_EXCHANGE]?: string;
    [TransactionType.SWAP]?: string;
    [TransactionType.TO_DESTINATION]?: string;
  };
  status: TransactionStatus;
}

export enum TransactionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
}

export interface TTransferOptions {
  from: TNodeWithRelayChains;
  to: TNodeWithRelayChains;
  currencyFrom: string;
  currencyTo: string;
  amount: string;
  injectorAddress: string;
  evmInjectorAddress?: string;
  recipientAddress: string;
  slippagePct: string;
  signer: Signer;
  evmSigner?: Signer;
  exchange?: TExchangeNode;
  onStatusChange?: (info: TTxProgressInfo) => void;
  type?: TransactionType;
}

export type TBuildTransferExtrinsicsOptions = Omit<
  TTransferOptions,
  'onStatusChange' | 'signer' | 'type'
>;

export type TTransferOptionsModified = Omit<TTransferOptions, 'exchange'> & {
  exchange: TNode;
  feeCalcAddress: string;
};

export type TCommonTransferOptions = Omit<TTransferOptions, 'signer'>;
export type TCommonTransferOptionsModified = Omit<TTransferOptionsModified, 'signer'>;

export type TAssetSymbols = string[];
export type TAssetsRecord = Record<TExchangeNode, TAssetSymbols>;

export interface TBuildTransferExtrinsicsResult {
  txs: [Extrinsic, Extrinsic, Extrinsic];
  exchangeNode: TNode;
}
