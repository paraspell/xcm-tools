// Contains detailed structure of XCM call construction for Bifrost Parachain on Kusama

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class BifrostKusama extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('BifrostKusama', 'bifrost', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const currencySelection = {
      [input.currency === this.getNativeAssetSymbol() ? 'Native' : 'Token']: input.currency
    }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default BifrostKusama
