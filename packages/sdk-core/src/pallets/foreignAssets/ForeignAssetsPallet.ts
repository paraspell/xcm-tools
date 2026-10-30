import type { TAssetInfo } from '@paraspell/assets'

import type { TPalletAssetId } from '../../types/TAssets'
import { AssetsPallet } from '../assets'

export class ForeignAssetsPallet extends AssetsPallet {
  protected resolveMintId(asset: TAssetInfo): TPalletAssetId {
    return asset.location
  }

  protected queryWithAssetId<T>(
    asset: TAssetInfo,
    query: (id: TPalletAssetId) => Promise<T>
  ): Promise<T> {
    return query(asset.location)
  }
}
