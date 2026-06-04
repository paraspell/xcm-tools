import { type TAssetInfo, type WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import type { TSetBalanceRes } from '../../types/TAssets'
import { BaseAssetsPallet } from '../../types/TAssets'
import { assertHasId } from '../../utils'

const LOCATION_ID_CHAINS: TSubstrateChain[] = ['EnergyWebX']
const BIGINT_ID_CHAINS: TSubstrateChain[] = ['Astar', 'Shiden', 'Moonbeam', 'NeuroWeb', 'Darwinia']

const resolveAssetId = (asset: WithAmount<TAssetInfo>, chain: TSubstrateChain): unknown => {
  if (LOCATION_ID_CHAINS.some(prefix => chain.startsWith(prefix))) {
    return asset.location
  }

  assertHasId(asset)

  const useBigInt = BIGINT_ID_CHAINS.some(prefix => chain.startsWith(prefix))
  return useBigInt ? BigInt(asset.assetId) : Number(asset.assetId)
}

export class AssetsPallet extends BaseAssetsPallet {
  mint<TApi, TRes, TSigner>(
    api: PolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: WithAmount<TAssetInfo>,
    _balance: bigint,
    chain: TSubstrateChain
  ): Promise<TSetBalanceRes> {
    const { amount } = asset

    const id = resolveAssetId(asset, chain)

    const notUseAddressIdChains: TSubstrateChain[] = ['NeuroWeb', 'Darwinia']

    const notUseId =
      notUseAddressIdChains.some(prefix => chain.startsWith(prefix)) || api.isChainEvm(chain)

    const addr = notUseId ? address : { Id: address }

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

  async getBalance<TApi, TRes, TSigner>(
    api: PolkadotApi<TApi, TRes, TSigner>,
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
