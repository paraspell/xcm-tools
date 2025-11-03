import { isChainEvm, type TAssetInfo, type WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

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
        parameters: {
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
        parameters: {
          id,
          beneficiary: addr,
          amount
        }
      }
    })
  }
}
