// Contains detailed structure of XCM call construction for Zeitgeist Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TForeignAsset,
  type TZeitgeistAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Zeitgeist extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Zeitgeist', 'zeitgeist', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const currencySelection: TZeitgeistAsset | TForeignAsset =
      input.currency === this.getNativeAssetSymbol() ? 'Ztg' : { ForeignAsset: input.currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Zeitgeist
