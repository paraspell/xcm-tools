import { type TAssetInfo, type WithAmount } from '@paraspell/assets'

import type { PolkadotApi } from '../../api'
import type SubstrateChain from '../../chains/SubstrateChain'
import type { TMintConfig, TSetBalanceRes } from '../../types/TAssets'
import { BaseAssetsPallet } from '../../types/TAssets'
import { assertHasId } from '../../utils'

const resolveAssetId = (asset: WithAmount<TAssetInfo>, config: TMintConfig): unknown => {
  if (config.useLocationId) return asset.location
  assertHasId(asset)
  return config.useBigIntId ? BigInt(asset.assetId) : Number(asset.assetId)
}

export class AssetsPallet extends BaseAssetsPallet {
  mint<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: WithAmount<TAssetInfo>,
    _balance: bigint,
    chain: SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TSetBalanceRes> {
    const { amount } = asset

    const config = chain.resolveMintConfig(api)

    const id = resolveAssetId(asset, config)

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
    assertHasId(asset)

    const fetchBalance = (useBigInt = false) =>
      api.queryState<{ balance: bigint }>({
        module: this.palletName,
        method: 'Account',
        params: [useBigInt ? BigInt(asset.assetId) : Number(asset.assetId), address]
      })

    // Try with number ID first, if it fails, try with bigint ID
    let balance
    try {
      balance = await fetchBalance()
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes('Incompatible runtime entry') ||
          e.message.includes('API Compatibility Error') ||
          e.message.includes('Number needs to be an integer'))
      ) {
        balance = await fetchBalance(true)
      } else {
        throw e
      }
    }

    const value = balance?.balance

    return value !== undefined ? BigInt(value) : 0n
  }
}
