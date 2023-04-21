import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class ParallelHeiko extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('ParallelHeiko', 'heiko', 'kusama')
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, input.currencyID)
  }
}

export default ParallelHeiko
