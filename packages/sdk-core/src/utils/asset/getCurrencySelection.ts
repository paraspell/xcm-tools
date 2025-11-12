import type { TAssetInfo, TCurrencyCore } from '@paraspell/assets'
import { isForeignAsset } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

export const getCurrencySelection = (chain: TSubstrateChain, asset: TAssetInfo): TCurrencyCore => {
  if (asset.location) return { location: asset.location }

  if (isForeignAsset(asset) && asset.assetId && !chain.startsWith('Bifrost')) {
    return { id: asset.assetId }
  }

  return { symbol: asset.symbol }
}
