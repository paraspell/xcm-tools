// Contains detailed structure of XCM call construction for Calamari Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall,
  type TMantaAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Calamari extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Calamari', 'calamari', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    // Currently only option for XCM transfer
    const { currencyID } = input
    const currencySelection: TMantaAsset = { MantaCurrency: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Calamari
