// Contains detailed structure of XCM call construction for Turing Parachain

import { InvalidCurrencyError } from '../../errors'
import XTokensTransferImpl from '../../pallets/xTokens'
import { type IXTokensTransfer, type TXTokensTransferOptions, Version } from '../../types'
import { isForeignAsset } from '../../utils/assets'
import ParachainNode from '../ParachainNode'

class Turing<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Turing', 'turing', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    if (!isForeignAsset(asset) || !asset.assetId) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return XTokensTransferImpl.transferXTokens(input, BigInt(asset.assetId))
  }
}

export default Turing
