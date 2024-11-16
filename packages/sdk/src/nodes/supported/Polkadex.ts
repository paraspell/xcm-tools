// Contains detailed structure of XCM call construction for Polkadex Parachain

import { InvalidCurrencyError } from '../../errors'
import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import { isForeignAsset } from '../../utils/assets'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Polkadex<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Polkadex', 'polkadex', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { asset } = input

    if (!isForeignAsset(asset) || !asset.assetId) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return XTokensTransferImpl.transferXTokens(input, BigInt(asset.assetId))
  }

  getProvider(): string {
    return 'wss://polkadex-parachain-rpc.dwellir.com'
  }
}

export default Polkadex
