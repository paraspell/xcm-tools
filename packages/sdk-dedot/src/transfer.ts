import {
  dryRun as dryRunImpl,
  dryRunOrigin as dryRunOriginImpl,
  getBridgeStatus as getBridgeStatusImpl,
  getParaEthTransferFees as getEthFeesImpl,
} from "@paraspell/sdk-core";
import { DRY_RUN_CLIENT_TIMEOUT_MS } from "@paraspell/sdk-core";

import DedotApi from "./DedotApi";
import type {
  TDedotApi,
  TDedotApiOrUrl,
  TDedotExtrinsic,
  TDedotSigner,
} from "./types";
import { createDedotApiCall } from "./utils";

export const dryRun = createDedotApiCall(
  dryRunImpl<TDedotApi, TDedotExtrinsic, TDedotSigner>,
);

export const dryRunOrigin = createDedotApiCall(
  dryRunOriginImpl<TDedotApi, TDedotExtrinsic, TDedotSigner>,
);

export const getParaEthTransferFees = async (api?: TDedotApiOrUrl) => {
  const dedotApi = new DedotApi(api);
  await dedotApi.init("AssetHubPolkadot", DRY_RUN_CLIENT_TIMEOUT_MS);
  return getEthFeesImpl(dedotApi);
};

/**
 * Gets the Ethereum bridge status.
 */
export const getBridgeStatus = async (api?: TDedotApiOrUrl) => {
  const dedotApi = new DedotApi(api);
  return getBridgeStatusImpl(dedotApi);
};
