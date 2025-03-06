import {
  claimAssets as claimAssetsImpl,
  getAssetBalance as getAssetBalanceImpl,
  getBalanceForeign as getBalanceForeignImpl,
  getBalanceNative as getBalanceNativeImpl,
  getMaxForeignTransferableAmount as getMaxForeignTransferableAmountImpl,
  getMaxNativeTransferableAmount as getMaxNativeTransferableAmountImpl,
  getOriginFeeDetails as getOriginFeeDetailsImpl,
  getTransferableAmount as getTransferableAmountImpl,
  getTransferInfo as getTransferInfoImpl,
  verifyEdOnDestination as verifyEdOnDestinationImpl
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
 * Retrieves detailed transfer information for a cross-chain transfer.
 *
 * @returns A Promise that resolves to the transfer information.
 */
export const getTransferInfo = createPolkadotJsApiCall(getTransferInfoImpl<TPjsApi, Extrinsic>)

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

export const getOriginFeeDetails = createPolkadotJsApiCall(
  getOriginFeeDetailsImpl<TPjsApi, Extrinsic>
)

export const getMaxNativeTransferableAmount = createPolkadotJsApiCall(
  getMaxNativeTransferableAmountImpl<TPjsApi, Extrinsic>
)

export const getMaxForeignTransferableAmount = createPolkadotJsApiCall(
  getMaxForeignTransferableAmountImpl<TPjsApi, Extrinsic>
)

export const getTransferableAmount = createPolkadotJsApiCall(
  getTransferableAmountImpl<TPjsApi, Extrinsic>
)

export const verifyEdOnDestination = createPolkadotJsApiCall(
  verifyEdOnDestinationImpl<TPjsApi, Extrinsic>
)

export {
  Foreign,
  ForeignAbstract,
  getAllAssetsSymbols,
  getAssetBySymbolOrId,
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
