// Contains detailed structure of XCM call construction for Amplitude Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Amplitude extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Amplitude', 'amplitude', 'kusama', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, { XCM: input.currency })
  }
}

export default Amplitude
