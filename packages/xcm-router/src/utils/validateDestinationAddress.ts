import { InvalidAddressError, isNodeEvm, type TNodeWithRelayChains } from '@paraspell/sdk';
import { ethers } from 'ethers';

export const validateDestinationAddress = (address: string, destination: TNodeWithRelayChains) => {
  if (typeof address === 'string') {
    const isDestinationEvm = isNodeEvm(destination);

    const isEthereumAddress = ethers.isAddress(address);

    if (isDestinationEvm) {
      if (!isEthereumAddress) {
        throw new InvalidAddressError(
          'Destination node is an EVM chain, but the address provided is not a valid Ethereum address.',
        );
      }
    } else {
      if (isEthereumAddress) {
        throw new InvalidAddressError('EVM address provided but destination is not an EVM chain.');
      }
    }
  }
};
