// Contains detailed structure of XCM call construction for Quartz Parachain

import {
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  type IXTokensTransfer,
  type XTokensTransferInput
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Quartz extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Quartz', 'quartz', 'kusama', Version.V3)
  }

  _assetCheckEnabled = false

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, { ForeignAssetId: currencyID })
  }
}

export default Quartz
