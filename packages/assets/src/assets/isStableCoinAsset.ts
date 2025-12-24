import { hasJunction, type TLocation } from '@paraspell/sdk-common'

import { STABLECOIN_IDS } from '../consts/consts'
import type { TAssetInfo } from '../types'

const hasStablecoinIndex = (location: TLocation, assetId?: number) =>
  assetId !== undefined
    ? hasJunction(location, 'GeneralIndex', assetId)
    : STABLECOIN_IDS.some(id => hasJunction(location, 'GeneralIndex', id))

const isStablecoinLocation = (location?: TLocation, assetId?: number): boolean =>
  !!location && hasJunction(location, 'PalletInstance', 50) && hasStablecoinIndex(location, assetId)

export const isStableCoinAsset = (asset: TAssetInfo, assetId?: number): boolean =>
  isStablecoinLocation(asset.location, assetId)
