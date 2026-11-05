import type { TAssetInfo, TCurrencyInputWithAmount } from '@paraspell/assets'
import { isAssetEqual } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'

export const usesOriginFeeAsset = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  origin: TSubstrateChain | TCustomChain,
  currency: TCurrencyInputWithAmount,
  assetInfo: TAssetInfo,
  feeAssetInfo: TAssetInfo | undefined,
  originFeeAsset: TAssetInfo
): boolean =>
  // Hydration chain origin delivery fee is 0n so we need to handle it only for AssetHubPolkadot
  origin === 'AssetHubPolkadot' &&
  !Array.isArray(currency) &&
  !!feeAssetInfo &&
  isAssetEqual(feeAssetInfo, assetInfo) &&
  isAssetEqual(originFeeAsset, feeAssetInfo) &&
  !isAssetEqual(feeAssetInfo, api.findNativeAssetInfoOrThrow(origin))
