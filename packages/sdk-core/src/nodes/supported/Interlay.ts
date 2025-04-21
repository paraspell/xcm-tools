// Contains detailed structure of XCM call construction for Interlay Parachain

import type { TAsset } from '@paraspell/assets'
import { isForeignAsset } from '@paraspell/assets'

import XTokensTransferImpl from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TForeignOrTokenAsset,
  type TXTokensTransferOptions,
  Version
} from '../../types'
import ParachainNode from '../ParachainNode'

class Interlay<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Interlay', 'interlay', 'polkadot', Version.V3)
  }

  getCurrencySelection(asset: TAsset): TForeignOrTokenAsset {
    return isForeignAsset(asset) ? { ForeignAsset: Number(asset.assetId) } : { Token: asset.symbol }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
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

export default Interlay
