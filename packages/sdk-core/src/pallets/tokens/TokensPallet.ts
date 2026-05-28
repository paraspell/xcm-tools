import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'
import { assertHasId, getChain } from '../../utils'

const resolveId = <TApi, TRes, TSigner>(
  api: PolkadotApi<TApi, TRes, TSigner>,
  asset: TAssetInfo,
  chain: TSubstrateChain
) => {
  if (chain === 'BifrostPolkadot' || chain === 'BifrostKusama' || chain === 'BifrostPaseo') {
    const isEthAsset = !asset.isNative && asset.assetId?.startsWith('0x')

    const resolvedAsset = isEthAsset
      ? api.findAssetInfoOrThrow(chain, { location: asset.location })
      : asset

    return getChain(chain).getCustomCurrencyId(api, resolvedAsset)
  } else {
    assertHasId(asset)
    return asset.assetId
  }
}

export class TokensPallet extends BaseAssetsPallet {
  mint<TApi, TRes, TSigner>(
    api: PolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: WithAmount<TAssetInfo>,
    balance: bigint,
    chain: TSubstrateChain
  ): Promise<TSetBalanceRes> {
    const isBifrost = chain.startsWith('Bifrost')

    if (!isBifrost) assertHasId(asset)

    const id = resolveId(api, asset, chain)

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

  async getBalance<TApi, TRes, TSigner>(
    api: PolkadotApi<TApi, TRes, TSigner>,
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
