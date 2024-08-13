// Contains detailed structure of XCM call construction for Manta Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TMantaAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Manta extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Manta', 'manta', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID } = input
    const currencySelection: TMantaAsset = { MantaCurrency: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Manta
