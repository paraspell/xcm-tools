// Contains detailed structure of XCM call construction for Quartz Parachain

import {
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  type IXTokensTransfer,
  type XTokensTransferInput
} from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class Quartz extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Quartz', 'quartz', 'kusama', Version.V3)
  }

  _assetCheckEnabled = false

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return getNode('Unique').transferXTokens(input)
  }
}

export default Quartz
