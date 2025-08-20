import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import type { IAssetsPallet, TSetBalanceRes } from '../../types/TAssets'
import { assertHasId } from '../../utils'

export class CurrenciesPallet implements IAssetsPallet {
  setBalance(address: string, assetInfo: WithAmount<TAssetInfo>): TSetBalanceRes {
    assertHasId(assetInfo)

    const { assetId, amount } = assetInfo

    return {
      balanceTx: {
        module: 'Currencies',
        method: 'update_balance',
        parameters: {
          who: address,
          currency_id: Number(assetId),
          amount
        }
      }
    }
  }
}
