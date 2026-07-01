import { type TAssetInfo, type WithAmount } from '@paraspell/assets'

import type { PolkadotApi } from '../../api'
import type SubstrateChain from '../../chains/SubstrateChain'
import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'

export class BalancesPallet extends BaseAssetsPallet {
  mint<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    balance: bigint,
    chain: SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TSetBalanceRes> {
    const { amount } = assetInfo

    const { useIdPrefix } = chain.resolveMintConfig(api)

    return Promise.resolve({
      balanceTx: {
        module: this.palletName,
        method: 'force_set_balance',
        params: {
          who: useIdPrefix ? { Id: address } : address,
          new_free: balance + amount
        }
      }
    })
  }

  async getBalance<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string
  ): Promise<bigint> {
    const balance = await api.queryState<{ free: bigint }>({
      module: this.palletName,
      method: 'Account',
      params: [address]
    })
    return balance?.free ?? 0n
  }
}
