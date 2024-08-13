// Contains detailed structure of XCM call construction for Curio Parachain

import {
  TForeignOrTokenAsset,
  Version,
  type IXTokensTransfer,
  type XTokensTransferInput
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Curio extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Curio', 'curio', 'kusama', Version.V3)
  }

  private getCurrencySelection({
    currency,
    currencyID
  }: XTokensTransferInput): TForeignOrTokenAsset {
    if (currencyID) {
      return { ForeignAsset: currencyID }
    }
    return { Token: currency }
  }

  transferXTokens(input: XTokensTransferInput) {
    const currencySelection = this.getCurrencySelection(input)
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Curio
