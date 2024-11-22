import { BadRequestException } from '@nestjs/common';
import type { TNodePolkadotKusama } from '@paraspell/sdk';
import {
  NODE_NAMES,
  NODE_NAMES_DOT_KSM,
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
} from '@paraspell/sdk';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import { isAddress } from 'web3-validator';

export const validateNode = (
  node: string,
  options: { excludeEthereum?: boolean; withRelayChains?: boolean } = {},
) => {
  const { excludeEthereum = false, withRelayChains = false } = options;
  const nodeList = excludeEthereum ? NODE_NAMES_DOT_KSM : NODE_NAMES;
  const withRelaysNodeList = excludeEthereum
    ? NODES_WITH_RELAY_CHAINS_DOT_KSM
    : NODES_WITH_RELAY_CHAINS;
  const usedNodeList = withRelayChains ? withRelaysNodeList : nodeList;
  if (!usedNodeList.includes(node as TNodePolkadotKusama)) {
    throw new BadRequestException(
      `Node ${node} is not valid. Check docs for valid nodes.`,
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
