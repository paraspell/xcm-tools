// Contains detailed structure of XCM call construction for Imbue Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Imbue extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Imbue', 'imbue', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency, fees } = input
    return XTokensTransferImpl.transferXTokens(input, currency, fees)
  }
}

export default Imbue
