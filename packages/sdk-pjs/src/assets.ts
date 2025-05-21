import {
  claimAssets as claimAssetsImpl,
  getAssetBalance as getAssetBalanceImpl,
  getBalanceForeign as getBalanceForeignImpl,
  getBalanceNative as getBalanceNativeImpl,
  getOriginFeeDetails as getOriginFeeDetailsImpl
} from '@paraspell/sdk-core'

import type { Extrinsic, TPjsApi } from './types'
import { createPolkadotJsApiCall } from './utils'

/**
 * Retrieves the native balance for a given account on a specified node.
 *
 * @returns The native balance as a bigint.
 */
export const getBalanceNative = createPolkadotJsApiCall(getBalanceNativeImpl<TPjsApi, Extrinsic>)

/**
 * Retrieves the balance of a foreign asset for a given account on a specified node.
 *
 * @returns The balance of the foreign asset as a bigint, or null if not found.
 */
export const getBalanceForeign = createPolkadotJsApiCall(getBalanceForeignImpl<TPjsApi, Extrinsic>)

/**
 * Retrieves the asset balance for a given account on a specified node.
 *
 * @returns The asset balance as a bigint.
 */
export const getAssetBalance = createPolkadotJsApiCall(getAssetBalanceImpl<TPjsApi, Extrinsic>)

/**
 * Claims assets from a parachain.
 *
 * @returns An extrinsic representing the claim transaction.
 */
export const claimAssets = createPolkadotJsApiCall(claimAssetsImpl<TPjsApi, Extrinsic>)

/**
 * @deprecated This function is deprecated and will be removed in a future version.
 * Please use `builder.getOriginXcmFee()` or `builder.getOriginXcmFeeEstimate()` instead,
 * where `builder` is an instance of `Builder()`.
 * For more details, please refer to the documentation:
 * {@link https://paraspell.github.io/docs/sdk/xcmPallet.html#xcm-fee-origin-and-dest}
 */
export const getOriginFeeDetails = createPolkadotJsApiCall(
  getOriginFeeDetailsImpl<TPjsApi, Extrinsic>
)

export {
  findAsset,
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
  getTNode,
  hasSupportForAsset,
  isNodeEvm,
  Native,
  Override
} from '@paraspell/sdk-core'
