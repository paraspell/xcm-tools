// Contains detailed structure of XCM call construction for Imbue Parachain

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Imbue extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Imbue', 'imbue', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency } = input
    return XTokensTransferImpl.transferXTokens(input, currency)
  }
}

export default Imbue
