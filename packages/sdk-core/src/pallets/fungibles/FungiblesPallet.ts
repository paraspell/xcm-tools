import { type TAssetInfo } from '@paraspell/assets'

import type { IPolkadotApi } from '../../api'
import { AssetsPallet } from '../assets'

export class FungiblesPallet extends AssetsPallet {
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

    return balance?.balance ?? 0n
  }
}
