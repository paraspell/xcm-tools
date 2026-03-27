import type { TApiType, TTransactionContext } from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';
import type { Signer } from '@polkadot/api/types';
import type { DedotClient } from 'dedot';
import type { PolkadotClient, PolkadotSigner } from 'polkadot-api';
import { Binary } from 'polkadot-api';

import type { TApiTransaction, TProgressSwapEvent } from '../types';
import type { TApi, TTransaction } from './importSdk';
import { importSdk } from './importSdk';
import { submitTx } from './submitTransaction';

const selectSigner = (
  type: string,
  index: number,
  signer: PolkadotSigner | Signer,
  evmSigner?: PolkadotSigner | Signer,
): PolkadotSigner | Signer =>
  type === 'TRANSFER' && index === 0 ? signer : (evmSigner ?? signer);

const txFromHex = async (
  apiType: TApiType,
  api: TApi,
  hex: string,
): Promise<TTransaction> => {
  if (apiType === 'DEDOT') {
    return (api as DedotClient).toTx(hex as `0x${string}`);
  } else if (apiType === 'PJS') {
    return (api as ApiPromise).tx(hex);
  } else {
    const callData = Binary.fromHex(hex);
    return (api as PolkadotClient)
      .getUnsafeApi()
      .txFromCallData(callData) as Promise<TTransaction>;
  }
};

export const submitApiTransactions = async ({
  transactions,
  apiType,
  signer,
  senderAddress,
  evmSigner,
  onStatusChange,
}: {
  transactions: TApiTransaction[];
  apiType: TApiType;
  signer: PolkadotSigner | Signer;
  senderAddress: string;
  evmSigner?: PolkadotSigner | Signer;
  onStatusChange?: (status: TProgressSwapEvent) => void;
}) => {
  const { createChainClient } = await importSdk(apiType);

  for (const [index, { type, chain, tx: txHex }] of transactions.entries()) {
    onStatusChange?.({
      type,
      currentStep: index,
      routerPlan: transactions,
    });

    const api = await createChainClient(chain);
    const tx = await txFromHex(apiType, api, txHex);

    await submitTx(
      apiType,
      api,
      tx,
      selectSigner(type, index, signer, evmSigner),
      senderAddress,
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
  apiType,
  signer,
  senderAddress,
  evmSigner,
  onStatusChange,
}: {
  txContexts: TTransactionContext<TApi, TTransaction>[];
  apiType: TApiType;
  signer: PolkadotSigner | Signer;
  senderAddress: string;
  evmSigner?: PolkadotSigner | Signer;
  onStatusChange?: (status: TProgressSwapEvent) => void;
}) => {
  for (const [index, txContext] of txContexts.entries()) {
    onStatusChange?.({
      type: txContext.type,
      currentStep: index,
      routerPlan: txContexts,
    });

    await submitTx(
      apiType,
      txContext.api,
      txContext.tx,
      selectSigner(txContext.type, index, signer, evmSigner),
      senderAddress,
    );
  }

  onStatusChange?.({
    type: 'COMPLETED',
    currentStep: txContexts.length - 1,
    routerPlan: txContexts,
  });
};
