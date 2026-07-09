import { getBalance as getBalanceImpl } from '@paraspell/sdk-core'

import type { Extrinsic, TPjsApi, TPjsSigner } from './types'
import { createPolkadotJsApiCall } from './utils'

/**
 * Retrieves the asset balance for a given account on a specified chain.
 *
 * @returns The asset balance as a bigint.
 */
export const getBalance = createPolkadotJsApiCall(getBalanceImpl<TPjsApi, Extrinsic, TPjsSigner>)

export {
  findAssetInfo,
  Foreign,
  ForeignAbstract,
  getAllAssetsSymbols,
  getAssets,
  getAssetsObject,
  getExistentialDeposit,
  getNativeAssets,
  getNativeAssetSymbol,
  getOtherAssets,
  getRelayChainSymbol,
  getSupportedAssets,
  getTChain,
  isChainEvm,
  Native
} from '@paraspell/sdk-core'
