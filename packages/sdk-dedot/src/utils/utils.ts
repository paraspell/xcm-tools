import type {
  PolkadotApi,
  TApiOrUrl,
  TBuilderOptions,
  TSubstrateChain,
} from "@paraspell/sdk-core";
import { createChainClient as createChainClientInternal } from "@paraspell/sdk-core";

import DedotApi from "../DedotApi";
import type { TDedotApi, TDedotExtrinsic, TDedotSigner } from "../types";

export const createChainClient = (
  chain: TSubstrateChain,
  builderOptions?: TBuilderOptions<TApiOrUrl<TDedotApi>>,
) => {
  const dedotApi = new DedotApi(builderOptions);
  return createChainClientInternal(dedotApi, chain);
};

export const createDedotApiCall = <
  TArgs extends Record<string, unknown>,
  TResult,
>(
  apiCall: (
    options: TArgs & {
      api: PolkadotApi<TDedotApi, TDedotExtrinsic, TDedotSigner>;
    },
  ) => Promise<TResult>,
) => {
  return async (
    options: TArgs & { api?: TApiOrUrl<TDedotApi> },
  ): Promise<TResult> => {
    const dedotApi = new DedotApi(options.api);

    const optionsWithApi = {
      ...options,
      api: dedotApi,
    } as TArgs & {
      api: PolkadotApi<TDedotApi, TDedotExtrinsic, TDedotSigner>;
    };

    return apiCall(optionsWithApi);
  };
};
