import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'
import { assertHasLocation } from '../../utils'

export class ForeignAssetsPallet extends BaseAssetsPallet {
  mint(address: string, asset: WithAmount<TAssetInfo>): Promise<TSetBalanceRes> {
    assertHasLocation(asset)

    const { location, amount } = asset

    return Promise.resolve({
      assetStatusTx: {
        module: this.palletName,
        method: 'force_asset_status',
        parameters: {
          id: location,
          owner: { Id: address },
          issuer: { Id: address },
          admin: { Id: address },
          freezer: { Id: address },
          min_balance: 0n,
          is_sufficient: true,
          is_frozen: false
        }
      },
      balanceTx: {
        module: this.palletName,
        method: 'mint',
        parameters: {
          id: location,
          beneficiary: { Id: address },
          amount
        }
      }
    })
  }
}
