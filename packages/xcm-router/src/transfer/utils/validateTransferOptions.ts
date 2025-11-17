import { InvalidParameterError, isChainEvm } from '@paraspell/sdk';
import { ethers } from 'ethers-v6';

import type { TBuildTransactionsOptions } from '../../types';
import { validateDestinationAddress } from '../../utils/validateDestinationAddress';

export const validateTransferOptions = (options: TBuildTransactionsOptions) => {
  const { from, exchange, evmSenderAddress, senderAddress, recipientAddress, to } = options;

  if (exchange === undefined && from === undefined) {
    throw new InvalidParameterError(
      'Cannot use automatic exchange selection without specifying the origin chain',
    );
  }

  if (to && !recipientAddress) {
    throw new InvalidParameterError(
      'Recipient address is required when destination chain is specified',
    );
  }

  if (to && recipientAddress) validateDestinationAddress(recipientAddress, to);

  if (evmSenderAddress !== undefined && !ethers.isAddress(evmSenderAddress)) {
    throw new InvalidParameterError('Evm injector address is not a valid Ethereum address');
  }

  if (ethers.isAddress(senderAddress)) {
    throw new InvalidParameterError(
      'Injector address cannot be an Ethereum address. Please use an Evm injector address instead.',
    );
  }

  if (from && isChainEvm(from) && !evmSenderAddress) {
    throw new InvalidParameterError('EVM sender address must be provided for EVM chains.');
  }
};
