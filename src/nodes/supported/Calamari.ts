//Contains detailed structure of XCM call construction for Calamari Parachain

import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Calamari extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Calamari', 'calamari', 'kusama')
  }

  transferXTokens(input: XTokensTransferInput) {
    // Currently only option for XCM transfer
    const { currencyID, fees } = input
    return XTokensTransferImpl.transferXTokens(input, { MantaCurrency: currencyID }, fees)
  }
}

export default Calamari
