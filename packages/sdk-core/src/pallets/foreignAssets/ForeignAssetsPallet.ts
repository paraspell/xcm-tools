import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import type { IPolkadotApi } from '../../api'
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
        params: {
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
        params: {
          id: location,
          beneficiary: { Id: address },
          amount
        }
      }
    })
  }

  async getBalance<TApi, TRes>(
    api: IPolkadotApi<TApi, TRes>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    assertHasLocation(asset)
    const balance = await api.queryState<{ balance: bigint }>({
      module: this.palletName,
      method: 'Account',
      params: [asset.location, address]
    })
    const value = balance?.balance
    return value !== undefined ? BigInt(value) : 0n
  }
}
