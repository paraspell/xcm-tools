import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'
import { assertHasId } from '../../utils'

export class AssetManagerPallet extends BaseAssetsPallet {
  mint(address: string, asset: WithAmount<TAssetInfo>, balance: bigint): Promise<TSetBalanceRes> {
    assertHasId(asset)

    const { assetId, amount } = asset

    return Promise.resolve({
      balanceTx: {
        module: this.palletName,
        method: 'updateBalance',
        parameters: {
          who: { Id: address },
          currency_id: {
            ForeignAsset: assetId
          },
          amount: balance + amount
        }
      }
    })
  }
}
