import { BadRequestException } from '@nestjs/common';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import { isAddress } from 'web3-validator';

export const validateChain = <T extends readonly string[]>(
  chain: string,
  list: T,
) => {
  if (!list.includes(chain as T[number])) {
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
