import { type TAssetInfo, type WithAmount } from '@paraspell/assets'

import type { PolkadotApi } from '../../api'
import type SubstrateChain from '../../chains/SubstrateChain'
import type { TAssetState, TMintConfig, TPalletAssetId, TSetBalanceRes } from '../../types/TAssets'
import { BaseAssetsPallet } from '../../types/TAssets'
import { assertHasId } from '../../utils/assertions'

export class AssetsPallet extends BaseAssetsPallet {
  protected resolveMintId<TApi, TRes, TSigner, TCustomChain extends string = never>(
    asset: TAssetInfo,
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    chain: SubstrateChain<TApi, TRes, TSigner, TCustomChain>,
    config: TMintConfig
  ): TPalletAssetId {
    if (config.useLocationId) return api.localizeLocation(chain.chain, asset.location)
    assertHasId(asset)
    return config.useBigIntId ? BigInt(asset.assetId) : Number(asset.assetId)
  }

  protected async queryWithAssetId<T>(
    asset: TAssetInfo,
    query: (id: TPalletAssetId) => Promise<T>
  ): Promise<T> {
    assertHasId(asset)

    // Try with number ID first, if it fails, try with bigint ID
    try {
      return await query(Number(asset.assetId))
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes('Incompatible runtime entry') ||
          e.message.includes('API Compatibility Error') ||
          e.message.includes('Number needs to be an integer'))
      ) {
        return query(BigInt(asset.assetId))
      }
      throw e
    }
  }

  mint<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: WithAmount<TAssetInfo>,
    _balance: bigint,
    chain: SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TSetBalanceRes> {
    const { amount } = asset

    const config = chain.resolveMintConfig(api)

    const id = this.resolveMintId(asset, api, chain, config)

    const addr = config.useIdPrefix ? { Id: address } : address

    return Promise.resolve({
      assetStatusTx: {
        module: this.palletName,
        method: 'force_asset_status',
        params: {
          id,
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
          id,
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
    const balance = await this.queryWithAssetId(asset, id =>
      api.queryState<{ balance: bigint }>({
        module: this.palletName,
        method: 'Account',
        params: [id, address]
      })
    )

    const value = balance?.balance

    return value !== undefined ? BigInt(value) : 0n
  }

  async getAssetState<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ): Promise<TAssetState | undefined> {
    const details = await this.queryWithAssetId(asset, id =>
      api.queryState<{ is_sufficient?: boolean; isSufficient?: boolean }>({
        module: this.palletName,
        method: 'Asset',
        params: [id]
      })
    )

    return details
      ? { isSufficient: details.is_sufficient ?? details.isSufficient ?? false }
      : undefined
  }
}
