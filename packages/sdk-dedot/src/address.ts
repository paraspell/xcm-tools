import type { TSubstrateChain } from "@paraspell/sdk-core";
import { convertSs58 as convertSs58Impl } from "@paraspell/sdk-core";

import DedotApi from "./DedotApi";
import type { TDedotApi, TDedotExtrinsic, TDedotSigner } from "./types";

export const convertSs58 = (address: string, chain: TSubstrateChain) => {
  const dedotApi = new DedotApi();
  return convertSs58Impl<TDedotApi, TDedotExtrinsic, TDedotSigner>(
    dedotApi,
    address,
    chain,
  );
};
