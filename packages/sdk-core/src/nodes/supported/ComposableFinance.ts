// Contains detailed structure of XCM call construction for ComposableFinance Parachain

import { InvalidCurrencyError } from '../../errors'
import { type IXTokensTransfer, Version, type TXTokensTransferOptions } from '../../types'
import { isForeignAsset } from '../../utils/assets'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../../pallets/xTokens'

class ComposableFinance<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('ComposableFinance', 'composable', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    if (!isForeignAsset(asset) || !asset.assetId) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return XTokensTransferImpl.transferXTokens(input, BigInt(asset.assetId))
  }
}

export default ComposableFinance
