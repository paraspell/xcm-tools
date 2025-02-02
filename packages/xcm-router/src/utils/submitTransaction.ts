import { type Extrinsic } from '@paraspell/sdk-pjs';
import { type ApiPromise } from '@polkadot/api';
import { type Signer } from '@polkadot/types/types';

export const submitTransaction = async (
  api: ApiPromise,
  tx: Extrinsic,
  signer: Signer,
  senderAddress: string,
): Promise<string> => {
  await tx.signAsync(senderAddress, { signer });
  return new Promise((resolve, reject) => {
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
