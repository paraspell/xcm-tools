import {
  claimAssets as claimAssetsImpl,
  getBalance as getBalanceImpl,
} from "@paraspell/sdk-core";

import type { TDedotApi, TDedotExtrinsic, TDedotSigner } from "./types";
import { createDedotApiCall } from "./utils";

/**
 * Retrieves the asset balance for a given account on a specified chain.
 *
 * @returns The asset balance as a bigint.
 */
export const getBalance = createDedotApiCall(
  getBalanceImpl<TDedotApi, TDedotExtrinsic, TDedotSigner>,
);

/**
 * Claims assets from a parachain.
 *
 * @returns An extrinsic representing the claim transaction.
 */
export const claimAssets = createDedotApiCall(
  claimAssetsImpl<TDedotApi, TDedotExtrinsic, TDedotSigner>,
);

export {
  findAssetInfo,
  Foreign,
  ForeignAbstract,
  getAllAssetsSymbols,
  getAssetDecimals,
  getAssetId,
  getAssets,
  getAssetsObject,
  getExistentialDeposit,
  getNativeAssets,
  getNativeAssetSymbol,
  getOtherAssets,
  getRelayChainSymbol,
  getSupportedAssets,
  getTChain,
  hasSupportForAsset,
  isChainEvm,
  Native,
  Override,
} from "@paraspell/sdk-core";
