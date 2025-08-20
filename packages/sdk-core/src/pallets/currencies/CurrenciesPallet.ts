import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import type { IAssetsPallet, TSetBalanceRes } from '../../types/TAssets'
import { assertHasId } from '../../utils'

export class CurrenciesPallet implements IAssetsPallet {
  setBalance(address: string, assetInfo: WithAmount<TAssetInfo>): Promise<TSetBalanceRes> {
    assertHasId(assetInfo)

    const { assetId, amount } = assetInfo

    return Promise.resolve({
      balanceTx: {
        module: 'Currencies',
        method: 'update_balance',
        parameters: {
          who: address,
          currency_id: Number(assetId),
          amount
        }
      }
    })
  }
}
