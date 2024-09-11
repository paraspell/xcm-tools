import type {
  TNodeWithRelayChains,
  Extrinsic,
  TNode,
  TSerializedEthTransfer,
  TCurrencyCore,
  TAsset as SdkTAsset,
} from '@paraspell/sdk';
import { type Signer } from '@polkadot/types/types';
import { type EXCHANGE_NODES } from './consts/consts';
import { Signer as EthSigner } from 'ethers';

export type TExchangeNode = (typeof EXCHANGE_NODES)[number];

export interface TSwapOptions {
  currencyFrom: TCurrencyCore;
  currencyTo: TCurrencyCore;
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
  FROM_ETH = 'FROM_ETH',
  TO_ETH = 'TO_ETH',
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
  currencyFrom: TCurrencyCore;
  currencyTo: TCurrencyCore;
  amount: string;
  injectorAddress: string;
  evmInjectorAddress?: string;
  assetHubAddress?: string;
  recipientAddress: string;
  slippagePct: string;
  signer: Signer;
  evmSigner?: Signer;
  ethSigner?: EthSigner;
  exchange?: TExchangeNode;
  onStatusChange?: (info: TTxProgressInfo) => void;
  type?: TransactionType;
}

export type TBuildTransferExtrinsicsOptions = Omit<
  TTransferOptions,
  'onStatusChange' | 'signer' | 'evmSigner' | 'ethSigner'
> & {
  ethAddress?: string;
};

export type TTransferOptionsModified = Omit<TTransferOptions, 'exchange'> & {
  exchangeNode: TNode;
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
  node: TNodeWithRelayChains;
  statusType: TransactionType;
  wsProvider?: string;
};

export type TExtrinsicInfo = TBasicInfo & {
  tx: Extrinsic;
  type: 'EXTRINSIC';
};

export type TEthOptionsInfo = TBasicInfo & {
  tx: TSerializedEthTransfer | undefined;
  type: 'ETH_TRANSFER';
};

export type TBuildTransferExtrinsicsResult = Array<TExtrinsicInfo | TEthOptionsInfo>;

export type TAutoSelect = 'Auto select';
