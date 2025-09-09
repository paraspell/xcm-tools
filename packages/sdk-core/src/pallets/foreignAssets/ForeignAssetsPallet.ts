import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import type { IAssetsPallet, TSetBalanceRes } from '../../types/TAssets'
import { assertHasLocation } from '../../utils'

export class ForeignAssetsPallet implements IAssetsPallet {
  mint(address: string, asset: WithAmount<TAssetInfo>): Promise<TSetBalanceRes> {
    assertHasLocation(asset)

    const { location, amount } = asset

    return Promise.resolve({
      assetStatusTx: {
        module: 'ForeignAssets',
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
        module: 'ForeignAssets',
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
