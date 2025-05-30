// Contains detailed structure of XCM call construction for Kintsugi Parachain

import type { TAsset } from '@paraspell/assets'
import { isForeignAsset } from '@paraspell/assets'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TForeignOrTokenAsset,
  type TXTokensTransferOptions,
  Version
} from '../../types'
import ParachainNode from '../ParachainNode'

class Kintsugi<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Kintsugi', 'kintsugi', 'kusama', Version.V3)
  }

  getCurrencySelection(asset: TAsset): TForeignOrTokenAsset {
    return isForeignAsset(asset) ? { ForeignAsset: Number(asset.assetId) } : { Token: asset.symbol }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return this.transferLocalNonNativeAsset(options)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    return api.callTxMethod({
      module: 'Tokens',
      section: 'transfer',
      parameters: {
        dest: address,
        currency_id: this.getCurrencySelection(asset),
        value: BigInt(asset.amount)
      }
    })
  }
}

export default Kintsugi
