import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'

export class ForeignAssetsPallet extends BaseAssetsPallet {
  mint(
    address: string,
    asset: WithAmount<TAssetInfo>,
    _balance: bigint,
    chain: TSubstrateChain
  ): Promise<TSetBalanceRes> {
    const { location, amount } = asset

    const notUseId: TSubstrateChain[] = ['NeuroWeb']

    const addr = notUseId.some(prefix => chain.startsWith(prefix)) ? address : { Id: address }

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

  async getBalance<TApi, TRes, TSigner>(
    api: PolkadotApi<TApi, TRes, TSigner>,
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
