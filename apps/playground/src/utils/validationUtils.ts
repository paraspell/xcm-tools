import { CHAINS } from '@paraspell/sdk';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import { isAddress } from 'web3-validator';
import z from 'zod';

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

export const isDerivationPath = (value: string) => value.startsWith('//');

export const validateTransferAddress = (
  address: string,
  values: Pick<FormValues, 'from' | 'to'>,
  selectedAddress: string | undefined,
) => {
  if (!isValidWalletAddress(address) && !isDerivationPath(address)) {
    return 'Invalid address';
  }

  if (values.from === values.to && address === selectedAddress) {
    return 'Sender and receiver cannot be the same address when origin and destination networks are the same, please enter a different address for the receiver.';
  }

  return null;
};

export const isValidWsEndpoint = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'ws:' || url.protocol === 'wss:') &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
};

export const validateCustomEndpoint = (value: string) =>
  isValidWsEndpoint(value) ? null : 'Endpoint is not valid';

export const CustomEndpointSchema = z.object({
  chain: z.enum(CHAINS),
  endpoints: z
    .array(
      z.object({
        url: z
          .string()
          .refine(isValidWsEndpoint, { message: 'Invalid endpoint.' }),
      }),
    )
    .min(1),
});
