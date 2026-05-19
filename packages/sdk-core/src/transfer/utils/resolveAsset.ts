import type { TAssetInfo, TCurrencyInput } from '@paraspell/assets'
import { isTLocation, type TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import type { TDestination } from '../../types'

export const resolveAsset = <TApi, TRes, TSigner>(
  currency: TCurrencyInput,
  origin: TSubstrateChain,
  destination: TDestination,
  assetCheckEnabled: boolean,
  api: PolkadotApi<TApi, TRes, TSigner>
): TAssetInfo | null => {
  if (!assetCheckEnabled) return null
  const dest = !isTLocation(destination) ? destination : null
  return api.findAssetInfo(origin, currency, dest)
}
