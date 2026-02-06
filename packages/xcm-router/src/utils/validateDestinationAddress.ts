import { InvalidAddressError, isChainEvm, type TChain } from '@paraspell/sdk';
import { ethers } from 'ethers-v6';

export const validateDestinationAddress = (address: string, destination: TChain) => {
  if (typeof address === 'string') {
    const isDestinationEvm = isChainEvm(destination);

    const isEthereumAddress = ethers.isAddress(address);

    if (isDestinationEvm) {
      if (!isEthereumAddress) {
        throw new InvalidAddressError(
          'Destination chain is an EVM chain, but the address provided is not a valid Ethereum address.',
        );
      }
    } else {
      if (isEthereumAddress) {
        throw new InvalidAddressError('EVM address provided but destination is not an EVM chain.');
      }
    }
  }
};
