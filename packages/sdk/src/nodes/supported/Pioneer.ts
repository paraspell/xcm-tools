// Contains detailed structure of XCM call construction for Pioneer Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TNativeTokenAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Pioneer extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Pioneer', 'pioneer', 'kusama', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput) {
    // Multiple asset options needs addressing
    const { fees } = input
    const currencySelection: TNativeTokenAsset = 'NativeToken'
    return XTokensTransferImpl.transferXTokens(input, currencySelection, fees)
  }
}

export default Pioneer
