// Contains detailed structure of XCM call construction for Litmus Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class Litmus extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Litmus', 'litmus', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    // Multiple asset options needs addressing
    return getNode('Litentry').transferXTokens(input)
  }
}

export default Litmus
