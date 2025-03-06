// Contains detailed structure of XCM call construction for Unique Parachain

import { InvalidCurrencyError } from '../../errors'
import XTokensTransferImpl from '../../pallets/xTokens'
import { type IXTokensTransfer, type TXTokensTransferOptions, Version } from '../../types'
import { isForeignAsset } from '../../utils/assets'
import ParachainNode from '../ParachainNode'

class Unique<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  private static NATIVE_ASSET_ID = 0

  constructor() {
    super('Unique', 'unique', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    if (asset.symbol === this.getNativeAssetSymbol()) {
      return XTokensTransferImpl.transferXTokens(input, Unique.NATIVE_ASSET_ID)
    }

    if (!isForeignAsset(asset) || !asset.assetId) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return XTokensTransferImpl.transferXTokens(input, Number(asset.assetId))
  }
}

export default Unique
