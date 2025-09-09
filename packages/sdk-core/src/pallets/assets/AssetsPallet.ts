import { isChainEvm, type TAssetInfo, type WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IAssetsPallet, TSetBalanceRes } from '../../types/TAssets'
import { assertHasId } from '../../utils'

export class AssetsPallet implements IAssetsPallet {
  mint(
    address: string,
    asset: WithAmount<TAssetInfo>,
    _balance: bigint,
    chain: TSubstrateChain
  ): Promise<TSetBalanceRes> {
    assertHasId(asset)

    const { assetId, amount } = asset

    const id =
      chain === 'Astar' || chain === 'Shiden' || chain === 'Moonbeam'
        ? BigInt(assetId)
        : Number(assetId)

    const addr = isChainEvm(chain) ? address : { Id: address }

    return Promise.resolve({
      assetStatusTx: {
        module: 'Assets',
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
        module: 'Assets',
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
