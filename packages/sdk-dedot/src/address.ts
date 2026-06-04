import type { TSubstrateChain } from "@paraspell/sdk-core";
import { convertSs58 as convertSs58Impl } from "@paraspell/sdk-core";

import DedotApi from "./DedotApi";

export const convertSs58 = (address: string, chain: TSubstrateChain) => {
  const dedotApi = new DedotApi();
  return convertSs58Impl(dedotApi, address, chain);
};
