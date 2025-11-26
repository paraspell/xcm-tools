import { isChainEvm, type TAssetInfo, type WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import type { TSetBalanceRes } from '../../types/TAssets'
import { BaseAssetsPallet } from '../../types/TAssets'
import { assertHasId } from '../../utils'

export class AssetsPallet extends BaseAssetsPallet {
  mint(
    address: string,
    asset: WithAmount<TAssetInfo>,
    _balance: bigint,
    chain: TSubstrateChain
  ): Promise<TSetBalanceRes> {
    assertHasId(asset)

    const { assetId, amount } = asset

    const bigintIdChains = ['Astar', 'Shiden', 'Moonbeam', 'NeuroWeb']
    const notUseAddressIdChains = ['NeuroWeb']

    const useBigInt = bigintIdChains.some(prefix => chain.startsWith(prefix))

    const id = useBigInt ? BigInt(assetId) : Number(assetId)

    const notUseId =
      notUseAddressIdChains.some(prefix => chain.startsWith(prefix)) || isChainEvm(chain)

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

  async getBalance<TApi, TRes>(
    api: IPolkadotApi<TApi, TRes>,
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
      if (e instanceof Error && e.message.includes('Incompatible runtime entry')) {
        balance = await fetchBalance(true)
      } else {
        throw e
      }
    }

    return balance?.balance ?? 0n
  }
}
