import { type TAssetInfo } from '@paraspell/assets'

import type { TPalletAssetId } from '../../types/TAssets'
import { AssetsPallet } from '../assets'

export class FungiblesPallet extends AssetsPallet {
  protected queryWithAssetId<T>(
    asset: TAssetInfo,
    query: (id: TPalletAssetId) => Promise<T>
  ): Promise<T> {
    return query(asset.location)
  }
}
