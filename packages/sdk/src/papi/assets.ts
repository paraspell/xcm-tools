import { getBalanceNative as getBalanceNativeImpl } from '../pallets/assets/balance/getBalanceNative'
import { getBalanceForeign as getBalanceForeignImpl } from '../pallets/assets/balance/getBalanceForeign'
import { getTransferInfo as getTransferInfoImpl } from '../pallets/assets/transfer-info/getTransferInfo'
import { getAssetBalance as getAssetBalanceImpl } from '../pallets/assets/balance/getAssetBalance'
import { getOriginFeeDetails as getOriginFeeDetailsImpl } from '../pallets/assets/getOriginFeeDetails'
import { default as claimAssetsImpl } from '../pallets/assets/asset-claim'
import { createPapiApiCall } from './utils'
import type { PolkadotClient } from 'polkadot-api'
import type { TPapiTransaction } from './types'

/**
 * Retrieves the native balance for a given account on a specified node.
 *
 * @returns The native balance as a bigint.
 */
export const getBalanceNative = createPapiApiCall(
  getBalanceNativeImpl<PolkadotClient, TPapiTransaction>
)

/**
 * Retrieves the balance of a foreign asset for a given account on a specified node.
 *
 * @returns The balance of the foreign asset as a bigint, or null if not found.
 */
export const getBalanceForeign = createPapiApiCall(
  getBalanceForeignImpl<PolkadotClient, TPapiTransaction>
)

/**
 * Retrieves detailed transfer information for a cross-chain transfer.
 *
 * @returns A Promise that resolves to the transfer information.
 */
export const getTransferInfo = createPapiApiCall(
  getTransferInfoImpl<PolkadotClient, TPapiTransaction>
)

/**
 * Retrieves the asset balance for a given account on a specified node.
 *
 * @returns The asset balance as a bigint.
 */
export const getAssetBalance = createPapiApiCall(
  getAssetBalanceImpl<PolkadotClient, TPapiTransaction>
)

/**
 * Claims assets from a parachain.
 *
 * @returns An extrinsic representing the claim transaction.
 */
export const claimAssets = createPapiApiCall(claimAssetsImpl<PolkadotClient, TPapiTransaction>)

export const getOriginFeeDetails = createPapiApiCall(
  getOriginFeeDetailsImpl<PolkadotClient, TPapiTransaction>
)

export * from '../pallets/assets/assets'
export * from '../pallets/assets/eds'
export { getSupportedAssets } from '../pallets/assets/getSupportedAssets'
