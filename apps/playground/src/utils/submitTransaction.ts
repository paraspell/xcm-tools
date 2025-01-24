import type { TPapiTransaction } from '@paraspell/sdk';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import type { Signer } from '@polkadot/api/types';
import type { PolkadotSigner, TxFinalizedPayload } from 'polkadot-api';

export const submitTransaction = async (
  api: ApiPromise,
  tx: Extrinsic,
  signer: Signer,
  injectorAddress: string,
  onSign?: () => void,
): Promise<string> => {
  await tx.signAsync(injectorAddress, { signer });
  if (onSign) onSign();
  return new Promise((resolve, reject) => {
    tx.send(({ status, dispatchError, txHash }) => {
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
    }).catch((error) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      reject(new Error(error));
    });
  });
};

export const submitTransactionPapi = async (
  tx: TPapiTransaction,
  signer: PolkadotSigner,
  onSign?: () => void,
): Promise<TxFinalizedPayload> => {
  return new Promise((resolve, reject) => {
    return tx.signSubmitAndWatch(signer).subscribe({
      next: (event) => {
        if (event.type === 'signed') {
          if (onSign) onSign();
        }

        if (
          event.type === 'finalized' ||
          (event.type === 'txBestBlocksState' && event.found)
        ) {
          if (!event.ok) {
            reject(new Error(JSON.stringify(event.dispatchError.value)));
          } else {
            resolve(event);
          }
        }
      },
      error: (error) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        reject(new Error(error));
      },
    });
  });
};
