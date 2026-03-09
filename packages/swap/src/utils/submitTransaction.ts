import { type TPapiTransaction, UnsupportedOperationError } from '@paraspell/sdk';
import { InvalidTxError, type PolkadotSigner, type TxFinalizedPayload } from 'polkadot-api';

export const submitTransaction = async (
  tx: TPapiTransaction,
  signer: PolkadotSigner,
  onSign?: () => void,
): Promise<TxFinalizedPayload> => {
  return new Promise((resolve, reject) => {
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
            reject(new UnsupportedOperationError(errorMsg));
          } else {
            resolve(event);
          }
        }
      },
      error: (error) => {
        if (error instanceof InvalidTxError) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const typedErr = error.error;
          reject(new UnsupportedOperationError(`Invalid transaction: ${JSON.stringify(typedErr)}`));
        } else {
          reject(error instanceof Error ? error : new UnsupportedOperationError(String(error)));
        }
      },
    });
  });
};
