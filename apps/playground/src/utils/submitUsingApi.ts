import { Signer } from '@polkadot/api/types';
import { API_URL } from '../consts';
import axios, { AxiosError } from 'axios';
import { TNodeWithRelayChains, createApiInstanceForNode } from '@paraspell/sdk';
import { buildTx, submitTransaction } from '../utils';

export const fetchFromApi = async <T>(params: T, endpoint: string, method: string = 'GET') => {
  try {
    const response = await axios(`${API_URL}${endpoint}`, {
      method,
      params: {
        ...params,
      },
    });

    return await response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error(error);
      let errorMessage = 'Error while fetching data.';
      if (error.response === undefined) {
        errorMessage += " Couldn't connect to API.";
      } else {
        const serverMessage =
          error.response.data && error.response.data.message
            ? ' Server response: ' + error.response.data.message
            : '';
        errorMessage += serverMessage;
      }
      throw new Error(errorMessage);
    } else if (error instanceof Error) {
      console.error(error);
      throw new Error(error.message);
    }
  }
};

export const submitTxUsingApi = async <T>(
  params: T,
  fromNode: TNodeWithRelayChains,
  endpoint: string,
  injectorAddress: string,
  signer: Signer,
  method: string = 'GET',
) => {
  const serializedTx = await fetchFromApi({ ...params, injectorAddress }, endpoint, method);
  const api = await createApiInstanceForNode(fromNode);
  await submitTransaction(api, buildTx(api, serializedTx), signer, injectorAddress);
};
