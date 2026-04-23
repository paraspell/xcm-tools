import type { TChain } from '@paraspell/sdk';
import type { Chain } from 'viem';
import { darwinia, mainnet, moonbeam, moonriver } from 'viem/chains';

export const getViemChainConfig = (chain: TChain): Chain => {
  switch (chain) {
    case 'Moonbeam':
      return moonbeam;
    case 'Moonriver':
      return moonriver;
    case 'Darwinia':
      return darwinia;
    case 'Ethereum':
    default:
      return mainnet;
  }
};
