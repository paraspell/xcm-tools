// Contains detailed structure of XCM call construction for Kintsugi Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TForeignOrTokenAsset,
  type TXTokensTransferOptions
} from '../../types'
import Chain from '../Chain'

class Kintsugi<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IXTokensTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Kintsugi', 'kintsugi', 'Kusama', Version.V3)
  }

  getCustomCurrencyId(asset: TAssetInfo): TForeignOrTokenAsset {
    return asset.isNative ? { Token: asset.symbol } : { ForeignAsset: Number(asset.assetId) }
  }

  transferXTokens(input: TXTokensTransferOptions<TApi, TRes, TSigner>) {
    const { asset } = input
    const currencySelection = this.getCustomCurrencyId(asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return Promise.resolve(this.transferLocalNonNativeAsset(options))
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, address, isAmountAll, keepAlive } = options

    const currencyId = this.getCustomCurrencyId(asset)

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest: address,
          currency_id: currencyId,
          keep_alive: keepAlive
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Tokens',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        dest: address,
        currency_id: currencyId,
        value: asset.amount
      }
    })
  }

  getBalanceNative(
    api: IPolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    return this.getBalanceForeign(api, address, asset)
  }
}

export default Kintsugi
