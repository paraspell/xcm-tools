// Contains detailed structure of XCM call construction for Altair Parachain

import type { TForeignOrNativeAsset } from '../../types'
import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Altair<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Altair', 'altair', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currency, currencyID } = input
    const currencySelection: TForeignOrNativeAsset =
      currency === this.getNativeAssetSymbol() ? 'Native' : { ForeignAsset: Number(currencyID) }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Altair
