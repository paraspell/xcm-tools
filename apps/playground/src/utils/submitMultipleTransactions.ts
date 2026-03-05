import type {
  TPapiApi,
  TPapiTransaction,
  TTransactionContext,
} from '@paraspell/sdk';
import type { PolkadotSigner } from 'polkadot-api';
import { Binary, createClient } from 'polkadot-api';
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat';
import { getWsProvider } from 'polkadot-api/ws-provider';

import type { TApiTransaction, TProgressSwapEvent } from '../types';
import { submitTransactionPapi } from './submitTransaction';

const selectSigner = (
  type: string,
  index: number,
  signer: PolkadotSigner,
  evmSigner?: PolkadotSigner,
): PolkadotSigner =>
  type === 'TRANSFER' && index === 0 ? signer : (evmSigner ?? signer);

export const submitApiTransactions = async ({
  transactions,
  signer,
  evmSigner,
  onStatusChange,
}: {
  transactions: TApiTransaction[];
  signer: PolkadotSigner;
  evmSigner?: PolkadotSigner;
  onStatusChange?: (status: TProgressSwapEvent) => void;
}) => {
  for (const [
    index,
    { type, wsProviders, tx: txHex },
  ] of transactions.entries()) {
    onStatusChange?.({
      type,
      currentStep: index,
      routerPlan: transactions,
    });

    const client = createClient(
      withPolkadotSdkCompat(getWsProvider(wsProviders)),
    );

    await submitTransactionPapi(
      await client.getUnsafeApi().txFromCallData(Binary.fromHex(txHex)),
      selectSigner(type, index, signer, evmSigner),
    );
  }

  onStatusChange?.({
    type: 'COMPLETED',
    currentStep: transactions.length - 1,
    routerPlan: transactions,
  });
};

export const submitSdkTransactions = async ({
  txContexts,
  signer,
  evmSigner,
  onStatusChange,
}: {
  txContexts: TTransactionContext<TPapiApi, TPapiTransaction>[];
  signer: PolkadotSigner;
  evmSigner?: PolkadotSigner;
  onStatusChange?: (status: TProgressSwapEvent) => void;
}) => {
  for (const [index, txContext] of txContexts.entries()) {
    onStatusChange?.({
      type: txContext.type,
      currentStep: index,
      routerPlan: txContexts,
    });

    await submitTransactionPapi(
      txContext.tx,
      selectSigner(txContext.type, index, signer, evmSigner),
    );
  }

  onStatusChange?.({
    type: 'COMPLETED',
    currentStep: txContexts.length - 1,
    routerPlan: txContexts,
  });
};
