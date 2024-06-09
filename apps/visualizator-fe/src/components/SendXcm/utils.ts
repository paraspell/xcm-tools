import { ApiPromise } from '@polkadot/api';
import { Extrinsic } from '@paraspell/sdk';
import { Signer } from '@polkadot/api/types';
import { encodeAddress, decodeAddress } from '@polkadot/keyring';
import { isHex, hexToU8a } from '@polkadot/util';
import { isAddress } from 'web3-validator';

export const submitTransaction = async (
  api: ApiPromise,
  tx: Extrinsic,
  signer: Signer,
  injectorAddress: string
): Promise<string> => {
  await tx.signAsync(injectorAddress, { signer });
  return await new Promise((resolve, reject) => {
    void tx.send(({ status, dispatchError, txHash }) => {
      if (status.isFinalized) {
        // Check if there are any dispatch errors
        if (dispatchError !== undefined) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            const { docs, name, section } = decoded;

            reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else {
          // No dispatch error, transaction should be successful
          resolve(txHash.toString());
        }
      }
    });
  });
};

export const isValidPolkadotAddress = (address: string) => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
    return true;
  } catch (error) {
    return false;
  }
};

export const isValidEthereumAddress = (address: string) => isAddress(address);

export const isValidWalletAddress = (address: string) =>
  isValidPolkadotAddress(address) || isValidEthereumAddress(address);
