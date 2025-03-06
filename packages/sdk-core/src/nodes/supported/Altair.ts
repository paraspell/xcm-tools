// Contains detailed structure of XCM call construction for Altair Parachain

import { InvalidCurrencyError } from '../../errors'
import XTokensTransferImpl from '../../pallets/xTokens'
import type { TAsset, TForeignOrNativeAsset } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions, Version } from '../../types'
import { isForeignAsset } from '../../utils/assets'
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
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Altair
