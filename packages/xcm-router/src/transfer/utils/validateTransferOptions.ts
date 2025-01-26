import { ethers } from 'ethers';
import type { TTransferOptions } from '../../types';
import { validateDestinationAddress } from '../../utils/validateDestinationAddress';

export const validateTransferOptions = (
  options: Pick<
    TTransferOptions,
    'evmInjectorAddress' | 'injectorAddress' | 'recipientAddress' | 'to'
  >,
) => {
  const { evmInjectorAddress, injectorAddress, recipientAddress, to } = options;

  validateDestinationAddress(recipientAddress, to);

  if (evmInjectorAddress !== undefined && !ethers.isAddress(evmInjectorAddress)) {
    throw new Error('Evm injector address is not a valid Ethereum address');
  }

  if (ethers.isAddress(injectorAddress)) {
    throw new Error(
      'Injector address cannot be an Ethereum address. Please use an Evm injector address instead.',
    );
  }
};
