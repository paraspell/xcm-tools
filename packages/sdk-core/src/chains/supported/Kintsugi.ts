// Contains detailed structure of XCM call construction for Kintsugi Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { isForeignAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TForeignOrTokenAsset,
  type TXTokensTransferOptions
} from '../../types'
import Parachain from '../Parachain'

class Kintsugi<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Kintsugi', 'kintsugi', 'Kusama', Version.V3)
  }

  getCurrencySelection(asset: TAssetInfo): TForeignOrTokenAsset {
    return isForeignAsset(asset) ? { ForeignAsset: Number(asset.assetId) } : { Token: asset.symbol }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): Promise<TRes> {
    return Promise.resolve(this.transferLocalNonNativeAsset(options))
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    const currencyId = this.getCurrencySelection(asset)

    if (isAmountAll) {
      return api.callTxMethod({
        module: 'Tokens',
        method: 'transfer_all',
        parameters: {
          dest: address,
          currency_id: currencyId,
          keep_alive: false
        }
      })
    }

    return api.callTxMethod({
      module: 'Tokens',
      method: 'transfer',
      parameters: {
        dest: address,
        currency_id: currencyId,
        value: asset.amount
      }
    })
  }
}

export default Kintsugi
