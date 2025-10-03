import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'
import { assertHasId, getChain } from '../../utils'

export class CurrenciesPallet extends BaseAssetsPallet {
  mint(
    address: string,
    asset: WithAmount<TAssetInfo>,
    balance: bigint,
    chain: TSubstrateChain
  ): Promise<TSetBalanceRes> {
    const isKarura = chain.startsWith('Karura')

    const id = isKarura
      ? getChain('Karura').getCurrencySelection(asset)
      : (assertHasId(asset), Number(asset.assetId))

    const { amount } = asset

    return Promise.resolve({
      balanceTx: {
        module: this.palletName,
        method: 'update_balance',
        parameters: {
          who: isKarura ? { Id: address } : address,
          currency_id: id,
          amount: balance + amount
        }
      }
    })
  }
}
