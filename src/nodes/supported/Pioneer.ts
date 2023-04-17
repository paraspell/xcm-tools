import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Pioneer extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Pioneer', 'bitcountryPioneer', 'kusama')
  }

  transferXTokens(input: XTokensTransferInput) {
    // Multiple asset options needs addressing
    return XTokensTransferImpl.transferXTokens(input, 'NativeToken', input.fees)
  }
}

export default Pioneer
