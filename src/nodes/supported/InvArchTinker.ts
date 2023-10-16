// Contains detailed structure of XCM call construction for InvArchTinker Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class InvArchTinker extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('InvArchTinker', 'tinker', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }
}

export default InvArchTinker
