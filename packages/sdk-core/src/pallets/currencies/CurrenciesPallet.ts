import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
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
    const isAcala = chain.startsWith('Acala')
    const isAcalaLike = isKarura || isAcala

    const id = isAcalaLike
      ? getChain(isKarura ? 'Karura' : 'Acala').getCustomCurrencyId(asset)
      : (assertHasId(asset), Number(asset.assetId))

    const { amount } = asset

    return Promise.resolve({
      balanceTx: {
        module: this.palletName,
        method: 'update_balance',
        params: {
          who: isAcalaLike ? { Id: address } : address,
          currency_id: id,
          amount: balance + amount
        }
      }
    })
  }

  getBalance(): Promise<bigint> {
    throw new InvalidParameterError('No balance support.')
  }
}
