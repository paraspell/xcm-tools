import type { TPapiTransaction } from '@paraspell/sdk';
import { type Extrinsic } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import axios, { AxiosError } from 'axios';
import type { PolkadotClient } from 'polkadot-api';
import { Binary } from 'polkadot-api';

import { API_URL } from '../consts';
import type { TApiType } from '../types';

export const fetchFromApi = async <T>(
  params: T,
  endpoint: string,
  method = 'GET',
  useBody: boolean = false,
): Promise<unknown> => {
  try {
    const response = await axios(`${API_URL}${endpoint}`, {
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
      throw new Error(errorMessage);
    } else if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

export const getTxFromApi = async <T>(
  params: T,
  api: ApiPromise | PolkadotClient,
  endpoint: string,
  senderAddress: string,
  apiType: TApiType,
  method: string = 'GET',
  useBody = false,
): Promise<Extrinsic | TPapiTransaction> => {
  const txHash = await fetchFromApi(
    { ...params, senderAddress },
    endpoint,
    method,
    useBody,
  );

  if (apiType === 'PJS') {
    return (api as ApiPromise).tx(txHash as string);
  } else {
    const callData = Binary.fromHex(txHash as string);
    return (api as PolkadotClient).getUnsafeApi().txFromCallData(callData);
  }
};
