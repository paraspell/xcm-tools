import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import type { IPolkadotApi } from '../../api'
import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'

export class ForeignAssetsPallet extends BaseAssetsPallet {
  mint(address: string, asset: WithAmount<TAssetInfo>): Promise<TSetBalanceRes> {
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

  async getBalance<TApi, TRes, TSigner>(
    api: IPolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    const balance = await api.queryState<{ balance: bigint }>({
      module: this.palletName,
      method: 'Account',
      params: [asset.location, address]
    })
    const value = balance?.balance
    return value !== undefined ? BigInt(value) : 0n
  }
}
