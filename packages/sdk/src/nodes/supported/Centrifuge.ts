// Contains detailed structure of XCM call construction for Centrifuge Parachain

import { InvalidCurrencyError } from '../../errors'
import type { TAsset } from '../../types'
import { type IXTokensTransfer, Version, type TXTokensTransferOptions } from '../../types'
import { isForeignAsset } from '../../utils/assets'
import { getNodeProviders } from '../config'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

export class Centrifuge<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Centrifuge', 'centrifuge', 'polkadot', Version.V3)
  }

  private getCurrencySelection(asset: TAsset) {
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

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getNodeProviders(this.node)[1]
  }
}
