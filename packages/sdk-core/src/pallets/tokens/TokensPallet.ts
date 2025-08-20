import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IAssetsPallet, TSetBalanceRes } from '../../types/TAssets'
import { assertHasId, getChain } from '../../utils'

export class TokensPallet implements IAssetsPallet {
  setBalance(
    address: string,
    asset: WithAmount<TAssetInfo>,
    chain: TSubstrateChain
  ): Promise<TSetBalanceRes> {
    const isBifrost = chain.startsWith('Bifrost')

    if (!isBifrost) assertHasId(asset)

    const id = isBifrost
      ? getChain('BifrostPolkadot').getCurrencySelection(asset)
      : (assertHasId(asset), asset.assetId)

    const { amount } = asset

    return Promise.resolve({
      balanceTx: {
        module: 'Tokens',
        method: 'set_balance',
        parameters: {
          who: { Id: address },
          currency_id: id,
          new_free: amount,
          new_reserved: 0n
        }
      }
    })
  }
}
