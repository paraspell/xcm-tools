import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Litentry extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Litentry', 'litentry', 'polkadot')
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, 'SelfReserve')
  }
}

export default Litentry
