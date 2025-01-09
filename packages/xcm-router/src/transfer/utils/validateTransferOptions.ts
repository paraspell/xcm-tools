import { ethers } from 'ethers';
import type { TTransferOptions } from '../../types';
import { validateDestinationAddress } from '../../utils/validateDestinationAddress';

export const validateTransferOptions = (
  options: Pick<
    TTransferOptions,
    | 'evmInjectorAddress'
    | 'injectorAddress'
    | 'assetHubAddress'
    | 'recipientAddress'
    | 'from'
    | 'to'
  >,
) => {
  const { evmInjectorAddress, injectorAddress, assetHubAddress, recipientAddress, from, to } =
    options;

  validateDestinationAddress(recipientAddress, to);

  if (evmInjectorAddress !== undefined && !ethers.isAddress(evmInjectorAddress)) {
    throw new Error('Evm injector address is not a valid Ethereum address');
  }

  if (ethers.isAddress(injectorAddress)) {
    throw new Error(
      'Injector address cannot be an Ethereum address. Please use an Evm injector address instead.',
    );
  }

  if ((from === 'Ethereum' || to === 'Ethereum') && assetHubAddress === undefined) {
    throw new Error('AssetHub address is required when transferring to or from Ethereum');
  }
};
