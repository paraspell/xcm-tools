import {
  getBalanceNative as getBalanceNativeImpl,
  getBalanceForeign as getBalanceForeignImpl,
  getTransferInfo as getTransferInfoImpl,
  getAssetBalance as getAssetBalanceImpl,
  claimAssets as claimAssetsImpl,
  getOriginFeeDetails as getOriginFeeDetailsImpl,
  getMaxNativeTransferableAmount as getMaxNativeTransferableAmountImpl,
  getMaxForeignTransferableAmount as getMaxForeignTransferableAmountImpl,
  getTransferableAmount as getTransferableAmountImpl
} from '@paraspell/sdk-core'
import { createPapiApiCall } from './utils'
import type { TPapiApi, TPapiTransaction } from './types'

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
