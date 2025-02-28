// Contains detailed structure of XCM call construction for Darwinia Parachain

import { Version, type TSerializedApiCall } from '../../types'
import ParachainNode from '../ParachainNode'
import { NodeNotSupportedError } from '../../errors'

class Darwinia<TApi, TRes> extends ParachainNode<TApi, TRes> {
  constructor() {
    super('Darwinia', 'darwinia', 'polkadot', Version.V3)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Darwinia
