// Contains detailed structure of XCM call construction for Integritee Parachain

import { InvalidCurrencyError } from '../../errors'
import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Integritee extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Integritee', 'integritee', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    if (input.currency === 'KSM')
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency KSM`)
    return XTokensTransferImpl.transferXTokens(input, input.currency)
  }
}

export default Integritee
