import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import type { IAssetsPallet, TSetBalanceRes } from '../../types/TAssets'
import { assertHasId } from '../../utils'

export class AssetManagerPallet implements IAssetsPallet {
  setBalance(address: string, asset: WithAmount<TAssetInfo>): Promise<TSetBalanceRes> {
    assertHasId(asset)

    const { assetId, amount } = asset

    return Promise.resolve({
      balanceTx: {
        module: 'AssetManager',
        method: 'updateBalance',
        parameters: {
          who: { Id: address },
          currency_id: {
            ForeignAsset: assetId
          },
          amount
        }
      }
    })
  }
}
