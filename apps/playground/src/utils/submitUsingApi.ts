import type { TApiType } from '@paraspell/sdk';
import axios, { AxiosError } from 'axios';
import type { DedotClient } from 'dedot';
import type { PolkadotClient } from 'polkadot-api';
import { Binary } from 'polkadot-api';
import type { Hex, WalletClient } from 'viem';
import { parseTransaction } from 'viem';

import { API_URL } from '../constants';
import type { TApi, TTransaction } from './importSdk';

export const fetchFromApi = async <T, TResponse = unknown>(
  params: T,
  endpoint: string,
  method = 'GET',
  useBody: boolean = false,
): Promise<TResponse> => {
  try {
    const response = await axios<TResponse>(`${API_URL}${endpoint}`, {
      method,
      params: useBody ? undefined : params,
      data: useBody ? params : undefined,
    });

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      let errorMessage = 'Error while fetching data.';
      if (error.response === undefined) {
        errorMessage += " Couldn't connect to API.";
      } else {
        const serverMessage =
          error.response.data &&
          (error.response.data as { message: string }).message
            ? ' Server response: ' +
              JSON.stringify(
                (error.response.data as { message: string }).message,
              )
            : '';
        errorMessage += serverMessage;
      }
      throw new Error(errorMessage, { cause: error });
    } else if (error instanceof Error) {
      throw new Error(error.message, { cause: error });
    }
    throw new Error('An unknown error occurred while fetching data.', {
      cause: error,
    });
  }
};

const submitParsedEvmTx = async (
  hex: Hex,
  walletClient: WalletClient,
): Promise<Hex> => {
  const parsed = parseTransaction(hex);

  const account = walletClient.account;
  if (!account) {
    throw new Error('Connected wallet has no active account.');
  }

  return walletClient.sendTransaction({
    account,
    chain: walletClient.chain ?? null,
    to: parsed.to ?? undefined,
    data: parsed.data,
    value: parsed.value,
  });
};

export const submitEvmTxFromApi = async <T>(
  params: T,
  walletClient: WalletClient,
): Promise<Hex> => {
  const hex = await fetchFromApi<T, Hex>(
    params,
    '/evm-x-transfer',
    'POST',
    true,
  );
  return submitParsedEvmTx(hex, walletClient);
};

export const submitEvmApproveFromApi = async (
  params: { symbol: string; amount: bigint; sender: string },
  walletClient: WalletClient,
): Promise<Hex> => {
  const payload = {
    symbol: params.symbol,
    amount: params.amount.toString(),
    sender: params.sender,
  };
  const hex = await fetchFromApi<typeof payload, Hex>(
    payload,
    '/evm-approve',
    'POST',
    true,
  );
  return submitParsedEvmTx(hex, walletClient);
};

export const getTxFromApi = async <T>(
  params: T,
  api: TApi,
  endpoint: string,
  sender: string,
  apiType: TApiType,
  method: string = 'GET',
  useBody = false,
): Promise<TTransaction> => {
  const txHash = await fetchFromApi<T, string>(
    {
      ...params,
      sender,
    },
    endpoint,
    method,
    useBody,
  );

  if (apiType === 'DEDOT') {
    return (api as DedotClient).toTx(txHash as `0x${string}`);
  } else if (apiType === 'PJS') {
    throw new Error('XCM API does not support Polkadot.js API transactions.');
  } else {
    const callData = Binary.fromHex(txHash);
    return (api as PolkadotClient).getUnsafeApi().txFromCallData(callData);
  }
};
