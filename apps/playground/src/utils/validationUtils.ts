import { encodeAddress, decodeAddress } from '@polkadot/keyring';
import { isHex, hexToU8a } from '@polkadot/util';
import { isAddress } from 'web3-validator';

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
