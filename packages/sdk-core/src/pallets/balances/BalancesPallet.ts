import { isChainEvm, type TAssetInfo, type WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'

export class BalancesPallet extends BaseAssetsPallet {
  mint(
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    balance: bigint,
    chain: TSubstrateChain
  ): Promise<TSetBalanceRes> {
    const { amount } = assetInfo

    const notUseId = chain.startsWith('Hydration') || chain === 'Basilisk' || isChainEvm(chain)

    return Promise.resolve({
      balanceTx: {
        module: this.palletName,
        method: 'force_set_balance',
        parameters: {
          who: notUseId ? address : { Id: address },
          new_free: balance + amount
        }
      }
    })
  }
}
