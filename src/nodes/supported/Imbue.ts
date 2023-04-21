import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Imbue extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Imbue', 'imbue', 'kusama')
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency, fees } = input
    return XTokensTransferImpl.transferXTokens(input, currency, fees)
  }
}

export default Imbue
