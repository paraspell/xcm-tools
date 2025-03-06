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

import type { TPapiApi, TPapiTransaction } from './types'
import { createPapiApiCall } from './utils'

/**
 * Retrieves the native balance for a given account on a specified node.
 *
 * @returns The native balance as a bigint.
 */
export const getBalanceNative = createPapiApiCall(getBalanceNativeImpl<TPapiApi, TPapiTransaction>)

/**
 * Retrieves the balance of a foreign asset for a given account on a specified node.
 *
 * @returns The balance of the foreign asset as a bigint, or null if not found.
 */
export const getBalanceForeign = createPapiApiCall(
  getBalanceForeignImpl<TPapiApi, TPapiTransaction>
)

/**
 * Retrieves detailed transfer information for a cross-chain transfer.
 *
 * @returns A Promise that resolves to the transfer information.
 */
export const getTransferInfo = createPapiApiCall(getTransferInfoImpl<TPapiApi, TPapiTransaction>)

/**
 * Retrieves the asset balance for a given account on a specified node.
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

export const getOriginFeeDetails = createPapiApiCall(
  getOriginFeeDetailsImpl<TPapiApi, TPapiTransaction>
)

export const getMaxNativeTransferableAmount = createPapiApiCall(
  getMaxNativeTransferableAmountImpl<TPapiApi, TPapiTransaction>
)

export const getMaxForeignTransferableAmount = createPapiApiCall(
  getMaxForeignTransferableAmountImpl<TPapiApi, TPapiTransaction>
)

export const getTransferableAmount = createPapiApiCall(
  getTransferableAmountImpl<TPapiApi, TPapiTransaction>
)

export const verifyEdOnDestination = createPapiApiCall(
  verifyEdOnDestinationImpl<TPapiApi, TPapiTransaction>
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
