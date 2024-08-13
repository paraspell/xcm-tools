// Contains detailed structure of XCM call construction for Centrifuge Parachain

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

export class Centrifuge extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Centrifuge', 'centrifuge', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency, currencyID } = input
    const currencySelection =
      currency === this.getNativeAssetSymbol() ? 'Native' : { ForeignAsset: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}
