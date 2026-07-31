import type { TChain } from '@paraspell/sdk';
import type { Chain } from 'viem';
import { darwinia, mainnet } from 'viem/chains';

export const getViemChainConfig = (chain: TChain): Chain => {
  switch (chain) {
    case 'Darwinia':
      return darwinia;
    case 'Ethereum':
    default:
      return mainnet;
  }
};
