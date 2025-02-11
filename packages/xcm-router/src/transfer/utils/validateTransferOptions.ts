import { ethers } from 'ethers-v6';
import type { TBuildTransactionsOptions } from '../../types';
import { validateDestinationAddress } from '../../utils/validateDestinationAddress';

export const validateTransferOptions = (options: TBuildTransactionsOptions) => {
  const { from, exchange, evmSenderAddress, senderAddress, recipientAddress, to } = options;

  if (exchange === undefined && from === undefined) {
    throw new Error('Cannot use automatic exchange selection without specifying the origin node');
  }

  if (to && !recipientAddress) {
    throw new Error('Recipient address is required when destination node is specified');
  }

  if (to && recipientAddress) validateDestinationAddress(recipientAddress, to);

  if (evmSenderAddress !== undefined && !ethers.isAddress(evmSenderAddress)) {
    throw new Error('Evm injector address is not a valid Ethereum address');
  }

  if (ethers.isAddress(senderAddress)) {
    throw new Error(
      'Injector address cannot be an Ethereum address. Please use an Evm injector address instead.',
    );
  }
};
