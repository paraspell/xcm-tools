import { EvmBuilder } from '@paraspell/sdk';
import { type TTransferOptionsModified, TransactionType, TransactionStatus } from '../types';
import { maybeUpdateTransferStatus } from '../utils/utils';
import { ethers, type Signer } from 'ethers';

export const transferFromEthereum = async (options: TTransferOptionsModified) => {
  const { onStatusChange, amount, currencyFrom, ethSigner, assetHubAddress } = options;
  const ETH_PROVIDER = 'https://eth.llamarpc.com';
  const provider = new ethers.JsonRpcProvider(ETH_PROVIDER);
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.FROM_ETH,
    status: TransactionStatus.IN_PROGRESS,
  });
  await EvmBuilder(provider)
    .to('AssetHubPolkadot')
    .address(assetHubAddress ?? '')
    .amount(amount)
    .currency(currencyFrom)
    .signer(ethSigner as Signer)
    .build();
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.FROM_ETH,
    status: TransactionStatus.SUCCESS,
  });
};
