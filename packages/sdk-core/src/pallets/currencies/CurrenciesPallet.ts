import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'
import { assertHasId } from '../../utils'

export class CurrenciesPallet extends BaseAssetsPallet {
  mint(
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    balance: bigint
  ): Promise<TSetBalanceRes> {
    assertHasId(assetInfo)

    const { assetId, amount } = assetInfo

    return Promise.resolve({
      balanceTx: {
        module: this.palletName,
        method: 'update_balance',
        parameters: {
          who: address,
          currency_id: Number(assetId),
          amount: balance + amount
        }
      }
    })
  }
}
