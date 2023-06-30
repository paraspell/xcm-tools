// Contains detailed structure of XCM call construction for Pioneer Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Pioneer extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Pioneer', 'bitcountryPioneer', 'kusama', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput) {
    // Multiple asset options needs addressing
    return XTokensTransferImpl.transferXTokens(input, 'NativeToken', input.fees)
  }
}

export default Pioneer
