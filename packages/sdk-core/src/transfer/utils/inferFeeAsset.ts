import { findNativeAssetInfoOrThrow, type TAssetInfo } from '@paraspell/assets'
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { hasJunction } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'
import type { TDestination } from '../../types'

export const isMoonbeamWhAsset = (location: TLocation | undefined): boolean =>
  !!location &&
  hasJunction(location, 'Parachain', getParaId('Moonbeam')) &&
  hasJunction(location, 'PalletInstance', 110)

export const inferFeeAsset = (
  origin: TSubstrateChain,
  destination: TDestination,
  asset: TAssetInfo
): TAssetInfo | undefined => {
  if (origin === 'Hydration' && destination === 'Moonbeam' && isMoonbeamWhAsset(asset.location)) {
    return findNativeAssetInfoOrThrow(destination)
  }

  return undefined
}
