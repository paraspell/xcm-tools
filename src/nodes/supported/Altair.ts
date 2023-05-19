//Contains detailed structure of XCM call construction for Altair Parachain

import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Altair extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Altair', 'altair', 'kusama')
  }

  private static getCurrencySelection({ currency, currencyID }: XTokensTransferInput) {
    if (currency === 'AIR') return 'Native'
    if (currency === 'KSM') return currency
    return { ForeignAsset: currencyID }
  }

  transferXTokens(input: XTokensTransferInput) {
    const currencySelection = Altair.getCurrencySelection(input)
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Altair
