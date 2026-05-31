import { isJSONString, isNotEmpty } from '@mantine/form';
import { CHAINS } from '@paraspell/sdk';
import { LocationSchema } from '@paraspell/xcm-analyser';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import { isAddress } from 'web3-validator';
import z from 'zod';

import type { TFormValues } from '../types';

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
  values: Pick<TFormValues, 'from' | 'to'>,
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

export const validateLocation = (value: string) => {
  const baseError =
    isNotEmpty('Location is required')(value) ??
    isJSONString('Location must be valid JSON')(value);
  if (baseError) return baseError;

  const result = LocationSchema.safeParse(JSON.parse(value));
  return result.success ? null : z.prettifyError(result.error);
};

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
