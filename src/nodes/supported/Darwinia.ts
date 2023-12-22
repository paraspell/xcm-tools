// Contains detailed structure of XCM call construction for Darwinia Parachain

import {
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  type IXTokensTransfer,
  type XTokensTransferInput
} from '../../types'
import ParachainNode from '../ParachainNode'
import { NodeNotSupportedError } from '../../errors'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Darwinia extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Darwinia', 'darwinia', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return XTokensTransferImpl.transferXTokens(
      input,
      input.currency === 'RING' ? 'SelfReserve' : { ForeignAsset: input.currencyID }
    )
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Darwinia
