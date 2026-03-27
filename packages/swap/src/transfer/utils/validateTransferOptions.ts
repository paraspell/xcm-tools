import { InvalidAddressError, isChainEvm, MissingParameterError } from '@paraspell/sdk-core';
import { ethers } from 'ethers-v6';

import type { TBuildTransactionsOptions } from '../../types';
import { validateDestinationAddress } from '../../utils/validateDestinationAddress';

export const validateTransferOptions = <TApi, TRes, TSigner>(
  options: TBuildTransactionsOptions<TApi, TRes, TSigner>,
) => {
  const { from, exchange, evmSenderAddress, sender, recipient, to } = options;

  if (exchange === undefined && from === undefined) {
    throw new MissingParameterError('from', 'Origin chain is required when exchange is auto');
  }

  if (to && !recipient) {
    throw new MissingParameterError('recipient', 'Recipient address is required');
  }

  if (to && recipient) validateDestinationAddress(recipient, to);

  if (evmSenderAddress !== undefined && !ethers.isAddress(evmSenderAddress)) {
    throw new InvalidAddressError('Evm injector address is not a valid Ethereum address');
  }

  if (ethers.isAddress(sender)) {
    throw new InvalidAddressError(
      'Injector address cannot be an Ethereum address. Please use an Evm injector address instead.',
    );
  }

  if (from && isChainEvm(from) && !evmSenderAddress) {
    throw new MissingParameterError('evmSenderAddress', 'EVM sender address is required');
  }
};
