// Contains detailed structure of XCM call construction for Acala Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TForeignOrTokenAsset,
  type TXTokensTransferOptions
} from '../../types'
import ParachainNode from '../ParachainNode'

class Acala<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Acala', 'acala', 'polkadot', Version.V4)
  }

  getCurrencySelection(asset: TAssetInfo): TForeignOrTokenAsset {
    const symbol = asset.symbol === 'aSEED' ? 'AUSD' : asset.symbol
    return isForeignAsset(asset) ? { ForeignAsset: Number(asset.assetId) } : { Token: symbol }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    return api.callTxMethod({
      module: 'Currencies',
      method: 'transfer_native_currency',
      parameters: {
        dest: { Id: address },
        amount: asset.amount
      }
    })
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    if (asset.symbol.toLowerCase() === 'lcdot') {
      throw new InvalidCurrencyError('LcDOT local transfers are not supported')
    }

    return api.callTxMethod({
      module: 'Currencies',
      method: 'transfer',
      parameters: {
        dest: { Id: address },
        currency_id: this.getCurrencySelection(asset),
        amount: asset.amount
      }
    })
  }
}

export default Acala
