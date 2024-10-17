import type { ApiPromise } from '@polkadot/api'
import { getBalanceNative as getBalanceNativeImpl } from '../pallets/assets/balance/getBalanceNative'
import { getBalanceForeign as getBalanceForeignImpl } from '../pallets/assets/balance/getBalanceForeign'
import { getTransferInfo as getTransferInfoImpl } from '../pallets/assets/transfer-info/getTransferInfo'
import { default as claimAssetsImpl } from '../pallets/assets/asset-claim'
import type { Extrinsic } from './types'
import { createPolkadotJsApiCall } from './utils'

/**
 * Retrieves the native balance for a given account on a specified node.
 *
 * @param address - The address of the account.
 * @param node - The node on which to query the balance.
 * @param api - Optional API instance; if not provided, one will be created.
 * @returns The native balance as a bigint.
 */
export const getBalanceNative = createPolkadotJsApiCall(getBalanceNativeImpl<ApiPromise, Extrinsic>)

/**
 * Retrieves the balance of a foreign asset for a given account on a specified node.
 *
 * @param address - The address of the account.
 * @param node - The node on which to query the balance.
 * @param symbolOrId - The symbol or ID of the currency to query.
 * @param api - Optional API instance; if not provided, one will be created.
 * @returns The balance of the foreign asset as a bigint, or null if not found.
 * @throws Error if the pallet is unsupported.
 */
export const getBalanceForeign = createPolkadotJsApiCall(
  getBalanceForeignImpl<ApiPromise, Extrinsic>
)

/**
 * Retrieves detailed transfer information for a cross-chain transfer.
 *
 * @param origin - The origin node of the transfer.
 * @param destination - The destination node of the transfer.
 * @param accountOrigin - The account address on the origin node.
 * @param accountDestination - The account address on the destination node.
 * @param currency - The currency to be transferred.
 * @param amount - The amount to be transferred.
 * @returns A Promise that resolves to the transfer information.
 */
export const getTransferInfo = createPolkadotJsApiCall(getTransferInfoImpl<ApiPromise, Extrinsic>)

export const claimAssets = createPolkadotJsApiCall(claimAssetsImpl<ApiPromise, Extrinsic>)

export * from '../pallets/assets/eds'
export { getSupportedAssets } from '../pallets/assets/getSupportedAssets'
