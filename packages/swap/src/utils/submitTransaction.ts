import { type TPapiTransaction, UnsupportedOperationError } from '@paraspell/sdk';
import { InvalidTxError, type TxCreator, type TxFinalizedPayload } from 'polkadot-api';

export const submitTransaction = async (
  tx: TPapiTransaction,
  signer: TxCreator,
  onSign?: () => void,
): Promise<TxFinalizedPayload> => {
  return new Promise((resolve, reject) => {
    tx.createSubmitAndWatch(signer).subscribe({
      next: (event) => {
        if (event.type === 'created') {
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
          reject(
            new UnsupportedOperationError(`Invalid transaction: ${JSON.stringify(error.error)}`),
          );
        } else {
          reject(error instanceof Error ? error : new UnsupportedOperationError(String(error)));
        }
      },
    });
  });
};
