// Contains detailed structure of XCM call construction for ParallelHeiko Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class ParallelHeiko extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('ParallelHeiko', 'heiko', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return getNode('Parallel').transferXTokens(input)
  }
}

export default ParallelHeiko
