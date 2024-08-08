// Contains detailed structure of XCM call construction for Amplitude Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall,
  type TXcmAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Amplitude extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Amplitude', 'amplitude', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    const { currencyID } = input
    const currencySelection: TXcmAsset = { XCM: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Amplitude
