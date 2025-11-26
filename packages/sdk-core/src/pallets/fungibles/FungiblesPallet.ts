import { type TAssetInfo } from '@paraspell/assets'

import type { IPolkadotApi } from '../../api'
import { assertHasLocation } from '../../utils'
import { AssetsPallet } from '../assets'

export class FungiblesPallet extends AssetsPallet {
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

    return balance?.balance ?? 0n
  }
}
