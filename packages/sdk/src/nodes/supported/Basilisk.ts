// Contains detailed structure of XCM call construction for Basilisk Parachain

import { InvalidCurrencyError } from '../../errors'
import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import { isForeignAsset } from '../../utils/assets'
import { getNodeProviders } from '../config'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Basilisk<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Basilisk', 'basilisk', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { asset } = input

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return XTokensTransferImpl.transferXTokens(input, Number(asset.assetId))
  }

  getProvider(): string {
    // Prefer Dwellir RPC endpoint
    return getNodeProviders(this.node)[1]
  }
}

export default Basilisk
