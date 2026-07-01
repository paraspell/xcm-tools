// Contains detailed structure of XCM call construction for Centrifuge Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import SubstrateChain from '../SubstrateChain'

class Centrifuge<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IXTokensTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Centrifuge', 'centrifuge', 'Polkadot', Version.V4)
  }

  getCustomCurrencyId(api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>, asset: TAssetInfo) {
    if (asset.symbol === this.getNativeAssetSymbol(api)) return 'Native'
    assertHasId(asset)
    return { ForeignAsset: Number(asset.assetId) }
  }

  transferXTokens(input: TXTokensTransferOptions<TApi, TRes, TSigner, TCustomChain>) {
    const { asset, api } = input
    const currencySelection = this.getCustomCurrencyId(api, asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    const { api, assetInfo: asset, recipient, isAmountAll, keepAlive } = options

    const dest = { Id: recipient }
    const currencyId = this.getCustomCurrencyId(api, asset)

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
