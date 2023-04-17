import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Dorafactory extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Dorafactory', 'dorafactory', 'kusama')
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency, fees } = input
    return XTokensTransferImpl.transferXTokens(input, currency, fees)
  }
}

export default Dorafactory
