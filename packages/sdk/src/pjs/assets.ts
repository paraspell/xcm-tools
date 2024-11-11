import { getBalanceNative as getBalanceNativeImpl } from '../pallets/assets/balance/getBalanceNative'
import { getBalanceForeign as getBalanceForeignImpl } from '../pallets/assets/balance/getBalanceForeign'
import { getTransferInfo as getTransferInfoImpl } from '../pallets/assets/transfer-info/getTransferInfo'
import { getAssetBalance as getAssetBalanceImpl } from '../pallets/assets/balance/getAssetBalance'
import { getOriginFeeDetails as getOriginFeeDetailsImpl } from '../pallets/assets/getOriginFeeDetails'
import { default as claimAssetsImpl } from '../pallets/assets/asset-claim'
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

export * from '../pallets/assets/assets'
export * from '../pallets/assets/eds'
export * from '../pallets/assets/assetSelectors'
export * from '../pallets/assets/multiLocationSelectors'
export { getSupportedAssets } from '../pallets/assets/getSupportedAssets'
