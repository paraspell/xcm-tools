// Contains detailed structure of XCM call construction for Centrifuge Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class Centrifuge<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Centrifuge', 'centrifuge', 'Polkadot', Version.V4)
  }

  private getCurrencySelection(asset: TAssetInfo) {
    if (asset.symbol === this.getNativeAssetSymbol()) return 'Native'

    assertHasId(asset)

    return { ForeignAsset: Number(asset.assetId) }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    const dest = { Id: address }
    const currencyId = this.getCurrencySelection(asset)

    if (isAmountAll) {
      return api.callTxMethod({
        module: 'Tokens',
        method: 'transfer_all',
        parameters: {
          dest,
          currency_id: currencyId,
          keep_alive: false
        }
      })
    }

    return api.callTxMethod({
      module: 'Tokens',
      method: 'transfer',
      parameters: {
        dest,
        currency_id: currencyId,
        amount: asset.amount
      }
    })
  }
}

export default Centrifuge
