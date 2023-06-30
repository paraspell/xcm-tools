// Contains detailed structure of XCM call construction for Bifrost Parachain on Polkadot

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

export class BifrostPolkadot extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('BifrostPolkadot', 'bifrost', 'polkadot', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput) {
    // Multiple asset options need addressing
    const currencySelection = { Token: input.currency }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}
