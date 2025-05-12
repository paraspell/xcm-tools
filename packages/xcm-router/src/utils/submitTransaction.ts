<<<<<<< Updated upstream
import { type Extrinsic } from '@paraspell/sdk-pjs';
import { type ApiPromise } from '@polkadot/api';
import { type Signer } from '@polkadot/types/types';
=======
import type { TPapiTransaction } from '@paraspell/sdk';
import { InvalidTxError, type PolkadotSigner, type TxFinalizedPayload } from 'polkadot-api';
>>>>>>> Stashed changes

export const submitTransaction = async (
  api: ApiPromise,
  tx: Extrinsic,
  signer: Signer,
  senderAddress: string,
): Promise<string> => {
  await tx.signAsync(senderAddress, { signer });
  return new Promise((resolve, reject) => {
<<<<<<< Updated upstream
    void tx.send(({ status, dispatchError, txHash }) => {
      if (status.isFinalized) {
        // Check if there are any dispatch errors
        if (dispatchError !== undefined) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            const { docs, name, section } = decoded;

            reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
=======
    tx.signSubmitAndWatch(signer).subscribe({
      next: (event) => {
        if (event.type === 'signed') {
          onSign?.();
        }

        if (event.type === 'finalized') {
          if (!event.ok) {
            const errorMsg = event.dispatchError?.value
              ? JSON.stringify(event.dispatchError.value)
              : 'Transaction failed';
            reject(new Error(errorMsg));
>>>>>>> Stashed changes
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else {
          // No dispatch error, transaction should be successful
          resolve(txHash.toString());
        }
<<<<<<< Updated upstream
      }
=======
      },
      error: (error) => {
        if (error instanceof InvalidTxError) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const typedErr = error.error;
          reject(new Error(`Invalid transaction: ${JSON.stringify(typedErr)}`));
        } else {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      },
>>>>>>> Stashed changes
    });
  });
};
