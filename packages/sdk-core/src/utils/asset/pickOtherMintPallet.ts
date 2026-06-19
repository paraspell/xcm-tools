import type { TAssetInfo } from '@paraspell/assets'
import type { TAssetsPallet } from '@paraspell/pallets'

export const pickOtherMintPallet = (asset: TAssetInfo, pallets: TAssetsPallet[]): TAssetsPallet => {
  if (!asset.isNative && (!asset.assetId || asset.assetId.startsWith('0x'))) {
    // No assetId means it's probably a ForeignAssets pallet asset
    return pallets.find(pallet => pallet.startsWith('Foreign')) ?? pallets[0]
  }
  return pallets[0]
}
