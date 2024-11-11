import { API_URL } from "../consts";
import axios, { AxiosError } from "axios";
import type { PolkadotClient } from "polkadot-api";
import { Binary } from "polkadot-api";
import type { TApiType } from "../types";
import type { ApiPromise } from "@polkadot/api";
import type {
  TNodeDotKsmWithRelayChains,
  TSerializedApiCall,
} from "@paraspell/sdk";
import { createApiInstanceForNode, type Extrinsic } from "@paraspell/sdk";
import type { TPapiTransaction } from "@paraspell/sdk/papi";
import type { Signer } from "@polkadot/api/types";
import { buildTx, submitTransaction } from "../utils";

export const fetchFromApi = async <T>(
  params: T,
  endpoint: string,
  method = "GET",
  useBody: boolean = false,
): Promise<unknown> => {
  try {
    const response = await axios(`${API_URL}${endpoint}`, {
      method,
      params: useBody ? undefined : params,
      data: useBody ? params : undefined,
    });

    return await response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error(error);
      let errorMessage = "Error while fetching data.";
      if (error.response === undefined) {
        errorMessage += " Couldn't connect to API.";
      } else {
        const serverMessage =
          error.response.data &&
          (error.response.data as { message: string }).message
            ? " Server response: " +
              (error.response.data as { message: string }).message
            : "";
        errorMessage += serverMessage;
      }
      throw new Error(errorMessage);
    } else if (error instanceof Error) {
      console.error(error);
      throw new Error(error.message);
    }
  }
};

export const getTxFromApi = async <T>(
  params: T,
  api: ApiPromise | PolkadotClient,
  endpoint: string,
  injectorAddress: string,
  apiType: TApiType,
  method: string = "GET",
  useBody = false,
): Promise<Extrinsic | TPapiTransaction> => {
  const txHash = await fetchFromApi(
    { ...params, injectorAddress },
    endpoint,
    method,
    useBody,
  );

  if (apiType === "PJS") {
    return (api as ApiPromise).tx(txHash as string);
  } else {
    const callData = Binary.fromHex(txHash as string);
    return await (api as PolkadotClient)
      .getUnsafeApi()
      .txFromCallData(callData);
  }
};

export const submitTxUsingApi = async <T>(
  params: T,
  fromNode: TNodeDotKsmWithRelayChains,
  endpoint: string,
  injectorAddress: string,
  signer: Signer,
  method: string = "GET",
  useBody = false,
) => {
  const serializedTx = await fetchFromApi(
    { ...params, injectorAddress },
    endpoint,
    method,
    useBody,
  );
  const api = await createApiInstanceForNode(fromNode);
  await submitTransaction(
    api,
    buildTx(api, serializedTx as TSerializedApiCall),
    signer,
    injectorAddress,
  );
};
