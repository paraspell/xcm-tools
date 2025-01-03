// Contains detailed structure of XCM call construction for Zeitgeist Parachain

import { InvalidCurrencyError } from '../../errors'
import type { TAsset } from '../../types'
import {
  type IXTokensTransfer,
  Version,
  type TXTokensTransferOptions,
  type TXcmForeignAsset,
  type TZeitgeistAsset
} from '../../types'
import { isForeignAsset } from '../../utils/assets'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../../pallets/xTokens'

class Zeitgeist<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Zeitgeist', 'zeitgeist', 'polkadot', Version.V3)
  }

  private getCurrencySelection(asset: TAsset): TZeitgeistAsset | TXcmForeignAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) return 'Ztg'

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

export default Zeitgeist
