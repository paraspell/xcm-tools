import type {
  IPolkadotApi,
  TBuilderOptions,
  TSubstrateChain,
} from "@paraspell/sdk-core";
import { createChainClient as createChainClientInternal } from "@paraspell/sdk-core";

import DedotApi from "../DedotApi";
import type {
  TDedotApi,
  TDedotApiOrUrl,
  TDedotExtrinsic,
  TDedotSigner,
} from "../types";

export const createChainClient = (
  chain: TSubstrateChain,
  builderOptions?: TBuilderOptions<TDedotApiOrUrl>,
) => {
  const dedotApi = new DedotApi(builderOptions);
  return createChainClientInternal<TDedotApi, TDedotExtrinsic, TDedotSigner>(
    dedotApi,
    chain,
  );
};

export const createDedotApiCall = <
  TArgs extends Record<string, unknown>,
  TResult,
>(
  apiCall: (
    options: TArgs & {
      api: IPolkadotApi<TDedotApi, TDedotExtrinsic, TDedotSigner>;
    },
  ) => Promise<TResult>,
) => {
  return async (
    options: TArgs & { api?: TDedotApiOrUrl },
  ): Promise<TResult> => {
    const dedotApi = new DedotApi(options.api);

    const optionsWithApi = {
      ...options,
      api: dedotApi as IPolkadotApi<TDedotApi, TDedotExtrinsic, TDedotSigner>,
    } as TArgs & {
      api: IPolkadotApi<TDedotApi, TDedotExtrinsic, TDedotSigner>;
    };

    return apiCall(optionsWithApi);
  };
};
