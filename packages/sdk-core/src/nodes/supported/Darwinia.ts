// Contains detailed structure of XCM call construction for Darwinia Parachain

import { NodeNotSupportedError } from '../../errors'
import { type TSerializedApiCall, Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Darwinia<TApi, TRes> extends ParachainNode<TApi, TRes> {
  constructor() {
    super('Darwinia', 'darwinia', 'polkadot', Version.V3)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Darwinia
