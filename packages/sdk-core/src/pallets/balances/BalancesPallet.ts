import { isChainEvm, type TAssetInfo, type WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'

export class BalancesPallet extends BaseAssetsPallet {
  mint(
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    balance: bigint,
    chain: TSubstrateChain
  ): Promise<TSetBalanceRes> {
    const { amount } = assetInfo

    const noIdPrefixes = ['Hydration', 'NeuroWeb', 'Basilisk']
    const notUseId = noIdPrefixes.some(prefix => chain.startsWith(prefix)) || isChainEvm(chain)

    return Promise.resolve({
      balanceTx: {
        module: this.palletName,
        method: 'force_set_balance',
        params: {
          who: notUseId ? address : { Id: address },
          new_free: balance + amount
        }
      }
    })
  }

  async getBalance<TApi, TRes>(api: IPolkadotApi<TApi, TRes>, address: string): Promise<bigint> {
    const balance = await api.queryState<{ free: bigint }>({
      module: this.palletName,
      method: 'Account',
      params: [address]
    })
    return balance?.free ?? 0n
  }
}
