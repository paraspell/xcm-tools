// Contains detailed structure of XCM call construction for Centrifuge Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Chain from '../Chain'

class Centrifuge<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IXTokensTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Centrifuge', 'centrifuge', 'Polkadot', Version.V4)
  }

  getCustomCurrencyId(asset: TAssetInfo) {
    if (asset.symbol === this.getNativeAssetSymbol()) return 'Native'
    assertHasId(asset)
    return { ForeignAsset: Number(asset.assetId) }
  }

  transferXTokens(input: TXTokensTransferOptions<TApi, TRes, TSigner>) {
    const { asset } = input
    const currencySelection = this.getCustomCurrencyId(asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, address, isAmountAll, keepAlive } = options

    const dest = { Id: address }
    const currencyId = this.getCustomCurrencyId(asset)

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest,
          currency_id: currencyId,
          keep_alive: keepAlive
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Tokens',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        dest,
        currency_id: currencyId,
        amount: asset.amount
      }
    })
  }
}

export default Centrifuge
