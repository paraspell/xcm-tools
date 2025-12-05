import { claimAssets as claimAssetsImpl, getBalance as getBalanceImpl } from '@paraspell/sdk-core'

import type { Extrinsic, TPjsApi } from './types'
import { createPolkadotJsApiCall } from './utils'

/**
 * Retrieves the asset balance for a given account on a specified chain.
 *
 * @returns The asset balance as a bigint.
 */
export const getBalance = createPolkadotJsApiCall(getBalanceImpl<TPjsApi, Extrinsic>)

/**
 * Claims assets from a parachain.
 *
 * @returns An extrinsic representing the claim transaction.
 */
export const claimAssets = createPolkadotJsApiCall(claimAssetsImpl<TPjsApi, Extrinsic>)

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
  Override
} from '@paraspell/sdk-core'
