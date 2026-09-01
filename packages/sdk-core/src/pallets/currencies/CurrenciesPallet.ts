import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import type { PolkadotApi } from '../../api'
import type SubstrateChain from '../../chains/SubstrateChain'
import type { TMintConfig, TSetBalanceRes } from '../../types/TAssets'
import { BaseAssetsPallet } from '../../types/TAssets'
import { assertHasId } from '../../utils'

const resolveCurrencyId = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  asset: WithAmount<TAssetInfo>,
  chain: SubstrateChain<TApi, TRes, TSigner, TCustomChain>,
  config: TMintConfig
): unknown => {
  if (config.useCustomCurrencyId) return chain.getCustomCurrencyId(api, asset)
  assertHasId(asset)
  return Number(asset.assetId)
}

export class CurrenciesPallet extends BaseAssetsPallet {
  mint<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: WithAmount<TAssetInfo>,
    balance: bigint,
    chain: SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TSetBalanceRes> {
    const config = chain.resolveMintConfig(api)

    const { amount } = asset

    return Promise.resolve({
      balanceTx: {
        module: this.palletName,
        method: 'update_balance',
        params: {
          who: config.useCustomCurrencyId ? { Id: address } : address,
          currency_id: resolveCurrencyId(api, asset, chain, config),
          amount: balance + amount
        }
      }
    })
  }

  async getBalance<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    assertHasId(asset)

    const account = await api.queryRuntimeApi<{ free: bigint }>({
      module: 'CurrenciesApi',
      method: 'account',
      params: [Number(asset.assetId), address]
    })

    return account?.free !== undefined ? BigInt(account.free) : 0n
  }
}
