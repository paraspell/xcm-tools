// Contains detailed structure of XCM call construction for Altair Parachain

import type { TAsset } from '@paraspell/assets'
import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'

import { transferXTokens } from '../../pallets/xTokens'
import type { TForeignOrNativeAsset, TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions, Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Altair<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Altair', 'altair', 'kusama', Version.V3)
  }

  private getCurrencySelection(asset: TAsset): TForeignOrNativeAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) return 'Native'

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return { ForeignAsset: Number(asset.assetId) }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    if (asset.assetId === undefined) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return api.callTxMethod({
      module: 'Tokens',
      section: 'transfer',
      parameters: {
        dest: { Id: address },
        currency_id: this.getCurrencySelection(asset),
        amount: BigInt(asset.amount)
      }
    })
  }
}

export default Altair
