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
  if (!config.useCustomCurrencyId) {
    assertHasId(asset)
    return asset.assetId
  }

  const isEthAsset = !asset.isNative && asset.assetId?.startsWith('0x')
  const resolvedAsset = isEthAsset
    ? api.findAssetInfoOrThrow(chain.chain, { location: asset.location })
    : asset
  return chain.getCustomCurrencyId(api, resolvedAsset)
}

export class TokensPallet extends BaseAssetsPallet {
  mint<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: WithAmount<TAssetInfo>,
    balance: bigint,
    chain: SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TSetBalanceRes> {
    const id = resolveCurrencyId(api, asset, chain, chain.resolveMintConfig(api))

    const { amount } = asset

    return Promise.resolve({
      balanceTx: {
        module: this.palletName,
        method: 'set_balance',
        params: {
          who: { Id: address },
          currency_id: id,
          new_free: balance + amount,
          new_reserved: 0n
        }
      }
    })
  }

  async getBalance<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo,
    customCurrencyId?: unknown
  ): Promise<bigint> {
    const currencyId =
      customCurrencyId === undefined
        ? (assertHasId(asset), Number(asset.assetId))
        : customCurrencyId
    const balance = await api.queryState<{ free: bigint }>({
      module: this.palletName,
      method: 'Accounts',
      params: [address, currencyId]
    })
    const value = balance?.free
    return value !== undefined ? BigInt(value) : 0n
  }
}
