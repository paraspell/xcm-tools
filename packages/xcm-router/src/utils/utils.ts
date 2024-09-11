import {
  type TNodeWithRelayChains,
  type Extrinsic,
  InvalidCurrencyError,
  TCurrencyCore,
} from '@paraspell/sdk';
import BigNumber from 'bignumber.js';
import { type TTxProgressInfo } from '../types';

export const delay = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export const calculateTransactionFee = async (
  tx: Extrinsic,
  address: string,
): Promise<BigNumber> => {
  const { partialFee } = await tx.paymentInfo(address);
  return new BigNumber(partialFee.toString());
};

export const maybeUpdateTransferStatus = (
  onStatusChange: ((info: TTxProgressInfo) => void) | undefined,
  info: TTxProgressInfo,
): void => {
  if (onStatusChange !== undefined) {
    onStatusChange(info);
  }
};

export const validateRelayChainCurrency = (
  originNode: TNodeWithRelayChains,
  currency: TCurrencyCore,
): void => {
  if (
    'symbol' in currency &&
    ((originNode === 'Polkadot' && currency.symbol !== 'DOT') ||
      (originNode === 'Kusama' && currency.symbol !== 'KSM'))
  ) {
    throw new InvalidCurrencyError(`Invalid currency for ${originNode}`);
  }
};
