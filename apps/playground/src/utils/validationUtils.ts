import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import { isAddress } from 'web3-validator';

import type { FormValues } from '../components/XcmUtils/XcmUtilsForm';

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

export const validateTransferAddress = (
  address: string,
  values: Pick<FormValues, 'from' | 'to'>,
  selectedAddress: string | undefined,
) => {
  if (!isValidWalletAddress(address)) {
    return 'Invalid address';
  }

  // Prevent Transfer to the same address when origin and destination networks are the same
  if (values.from === values.to && address === selectedAddress) {
    return 'Sender and receiver cannot be the same address when origin and destination networks are the same, please enter a different address for the receiver.';
  }

  return null;
};
