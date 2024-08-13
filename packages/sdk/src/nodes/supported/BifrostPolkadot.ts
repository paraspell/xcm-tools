// Contains detailed structure of XCM call construction for Bifrost Parachain on Polkadot

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

export class BifrostPolkadot extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('BifrostPolkadot', 'bifrost', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const currencySelection = {
      [input.currency === this.getNativeAssetSymbol() ? 'Native' : 'Token']: input.currency
    }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}
