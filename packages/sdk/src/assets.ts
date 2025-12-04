import {
  claimAssets as claimAssetsImpl,
  getBalance as getAssetBalanceImpl,
  getBalance as getBalanceForeignImpl,
  getBalanceNative as getBalanceNativeImpl
} from '@paraspell/sdk-core'

import type { TPapiApi, TPapiTransaction } from './types'
import { createPapiApiCall } from './utils'

/**
 * Retrieves the native balance for a given account on a specified chain.
 *
 * @returns The native balance as a bigint.
 */
export const getBalanceNative = createPapiApiCall(getBalanceNativeImpl<TPapiApi, TPapiTransaction>)

/**
 * Retrieves the balance of a foreign asset for a given account on a specified chain.
 *
 * @returns The balance of the foreign asset as a bigint, or null if not found.
 */
export const getBalanceForeign = createPapiApiCall(
  getBalanceForeignImpl<TPapiApi, TPapiTransaction>
)

/**
 * Retrieves the asset balance for a given account on a specified chain.
 *
 * @returns The asset balance as a bigint.
 */
export const getAssetBalance = createPapiApiCall(getAssetBalanceImpl<TPapiApi, TPapiTransaction>)

/**
 * Claims assets from a parachain.
 *
 * @returns An extrinsic representing the claim transaction.
 */
export const claimAssets = createPapiApiCall(claimAssetsImpl<TPapiApi, TPapiTransaction>)

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
