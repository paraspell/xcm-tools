// Contains detailed structure of XCM call construction for Centrifuge Parachain

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

export class Centrifuge<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Centrifuge', 'centrifuge', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currency, currencyID } = input
    const currencySelection =
      currency === this.getNativeAssetSymbol() ? 'Native' : { ForeignAsset: Number(currencyID) }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}
