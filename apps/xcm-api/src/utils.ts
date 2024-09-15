import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  Extrinsic,
  NODE_NAMES,
  TNode,
  TSerializedApiCall,
} from '@paraspell/sdk';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import axios from 'axios';
import { isAddress } from 'web3-validator';

export const isNumeric = (num: string) => !isNaN(Number(num));

export const validateNode = (node: string) => {
  if (!NODE_NAMES.includes(node as TNode)) {
    throw new BadRequestException(
      `Node ${node} is not valid. Check docs for valid nodes.`,
    );
  }
};

export const validateRecaptcha = async (
  recaptcha: string,
  recaptchaSecretKey: string,
): Promise<boolean> => {
  const data = {
    secret: recaptchaSecretKey,
    response: recaptcha,
  };

  const response = await axios
    .post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: data,
    })
    .catch((error) => {
      throw new InternalServerErrorException(
        'Error verifying reCAPTCHA: ' + error,
      );
    });

  return (response.data as { success: boolean }).success;
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

export const serializeExtrinsic = (tx: Extrinsic): TSerializedApiCall => {
  return {
    module: tx.method.section,
    section: tx.method.method,
    parameters: tx.method.args.map((arg) => arg.toJSON()),
  };
};
