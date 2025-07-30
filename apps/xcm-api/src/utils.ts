import { BadRequestException } from '@nestjs/common';
import type { TChainPolkadotKusama } from '@paraspell/sdk';
import {
  CHAIN_NAMES,
  CHAIN_NAMES_DOT_KSM,
  CHAINS_WITH_RELAY_CHAINS,
  CHAINS_WITH_RELAY_CHAINS_DOT_KSM,
} from '@paraspell/sdk';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import { isAddress } from 'web3-validator';

export const validateChain = (
  chain: string,
  options: { excludeEthereum?: boolean; withRelayChains?: boolean } = {},
) => {
  const { excludeEthereum = false, withRelayChains = false } = options;
  const chainList = excludeEthereum ? CHAIN_NAMES_DOT_KSM : CHAIN_NAMES;
  const withRelaysChainList = excludeEthereum
    ? CHAINS_WITH_RELAY_CHAINS_DOT_KSM
    : CHAINS_WITH_RELAY_CHAINS;
  const usedChainList = withRelayChains ? withRelaysChainList : chainList;
  if (!usedChainList.includes(chain as TChainPolkadotKusama)) {
    throw new BadRequestException(
      `Chain ${chain} is not valid. Check docs for valid chains.`,
    );
  }
};

export const isValidPolkadotAddress = (address: string) => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
    return true;
  } catch (_e) {
    return false;
  }
};

export const isValidEthereumAddress = (address: string) => isAddress(address);

export const isValidWalletAddress = (address: string) =>
  isValidPolkadotAddress(address) || isValidEthereumAddress(address);
