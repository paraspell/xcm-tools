import type { TPapiTransaction } from '@paraspell/sdk';
import type { PolkadotSigner, TxFinalizedPayload } from 'polkadot-api';

export const submitTransaction = async (
  tx: TPapiTransaction,
  signer: PolkadotSigner,
  onSign?: () => void
): Promise<TxFinalizedPayload> => {
  return new Promise((resolve, reject) => {
    return tx.signSubmitAndWatch(signer).subscribe({
      next: event => {
        if (event.type === 'signed') {
          if (onSign) onSign();
        }

        if (event.type === 'finalized' || (event.type === 'txBestBlocksState' && event.found)) {
          if (!event.ok) {
            reject(new Error(JSON.stringify(event.dispatchError.value)));
          } else {
            resolve(event);
          }
        }
      },
      error: error => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        reject(new Error(error));
      }
    });
  });
};
