import type { ApiPromise } from '@polkadot/api'
import { getBalanceNative as getBalanceNativeImpl } from '../pallets/assets/balance/getBalanceNative'
import { getBalanceForeign as getBalanceForeignImpl } from '../pallets/assets/balance/getBalanceForeign'
import { getTransferInfo as getTransferInfoImpl } from '../pallets/assets/transfer-info/getTransferInfo'
import { getAssetBalance as getAssetBalanceImpl } from '../pallets/assets/balance/getAssetBalance'
import { default as claimAssetsImpl } from '../pallets/assets/asset-claim'
import type { Extrinsic } from './types'
import { createPolkadotJsApiCall } from './utils'

/**
 * Retrieves the native balance for a given account on a specified node.
 *
 * @returns The native balance as a bigint.
 */
export const getBalanceNative = createPolkadotJsApiCall(getBalanceNativeImpl<ApiPromise, Extrinsic>)

/**
 * Retrieves the balance of a foreign asset for a given account on a specified node.
 *
 * @returns The balance of the foreign asset as a bigint, or null if not found.
 */
export const getBalanceForeign = createPolkadotJsApiCall(
  getBalanceForeignImpl<ApiPromise, Extrinsic>
)

/**
 * Retrieves detailed transfer information for a cross-chain transfer.
 *
 * @returns A Promise that resolves to the transfer information.
 */
export const getTransferInfo = createPolkadotJsApiCall(getTransferInfoImpl<ApiPromise, Extrinsic>)

/**
 * Retrieves the asset balance for a given account on a specified node.
 *
 * @returns The asset balance as a bigint.
 */
export const getAssetBalance = createPolkadotJsApiCall(getAssetBalanceImpl<ApiPromise, Extrinsic>)

/**
 * Claims assets from a parachain.
 *
 * @returns An extrinsic representing the claim transaction.
 */
export const claimAssets = createPolkadotJsApiCall(claimAssetsImpl<ApiPromise, Extrinsic>)

export * from '../pallets/assets/assets'
export * from '../pallets/assets/eds'
export { getSupportedAssets } from '../pallets/assets/getSupportedAssets'
