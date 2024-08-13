// Contains detailed structure of XCM call construction for ComposableFinance Parachain

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class ComposableFinance extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('ComposableFinance', 'composable', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }
}

export default ComposableFinance
