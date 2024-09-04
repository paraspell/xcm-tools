// Contains detailed structure of XCM call construction for Altair Parachain

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Altair extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Altair', 'altair', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency, currencyID } = input
    const currencySelection =
      currency === this.getNativeAssetSymbol() ? 'Native' : { ForeignAsset: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Altair
