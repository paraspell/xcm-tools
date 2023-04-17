import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class HydraDX extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('HydraDX', 'hydra', 'polkadot')
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID, fees } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID, fees)
  }
}

export default HydraDX
