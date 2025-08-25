import { isChainEvm, type TAssetInfo, type WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IAssetsPallet, TSetBalanceRes } from '../../types/TAssets'

export class BalancesPallet implements IAssetsPallet {
  setBalance(
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    chain: TSubstrateChain
  ): TSetBalanceRes {
    const { amount } = assetInfo

    const notUseId = chain.startsWith('Hydration') || chain === 'Basilisk' || isChainEvm(chain)

    return {
      balanceTx: {
        module: 'Balances',
        method: 'force_set_balance',
        parameters: {
          who: notUseId ? address : { Id: address },
          new_free: amount
        }
      }
    }
  }
}
