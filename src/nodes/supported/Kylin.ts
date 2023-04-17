import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Kylin extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Kylin', 'kylin', 'polkadot')
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency, fees } = input
    return XTokensTransferImpl.transferXTokens(input, currency, fees, 'OrmlXTokens')
  }
}

export default Kylin
