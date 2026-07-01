import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import type { PolkadotApi } from '../../api'
import type SubstrateChain from '../../chains/SubstrateChain'
import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'

export class ForeignAssetsPallet extends BaseAssetsPallet {
  mint<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: WithAmount<TAssetInfo>,
    _balance: bigint,
    chain: SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TSetBalanceRes> {
    const { location, amount } = asset

    const { useIdPrefix } = chain.resolveMintConfig(api)

    const addr = useIdPrefix ? { Id: address } : address

    return Promise.resolve({
      assetStatusTx: {
        module: this.palletName,
        method: 'force_asset_status',
        params: {
          id: location,
          owner: addr,
          issuer: addr,
          admin: addr,
          freezer: addr,
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
          beneficiary: addr,
          amount
        }
      }
    })
  }

  async getBalance<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
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
