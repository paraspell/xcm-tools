import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import type { IPolkadotApi } from '../../api'
import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'
import { assertHasId, assertHasLocation } from '../../utils'

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
    assertHasId(asset)

    const collectionId = await api.queryChainState({
      module: this.palletName,
      method: 'ForeignAssetToCollection',
      params: [asset.location]
    })

    const balance = await api.queryRuntimeApi<bigint>({
      module: 'UniqueApi',
      method: 'balance',
      params: [collectionId, { type: 'Substrate', value: address }, asset.assetId]
    })

    return balance ?? 0n
  }
}
