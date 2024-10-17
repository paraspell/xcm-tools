// Contains detailed structure of XCM call construction for Ethereum

import { Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Ethereum<TApi, TRes> extends ParachainNode<TApi, TRes> {
  constructor() {
    super('Ethereum', 'ethereum', 'polkadot', Version.V3)
  }
}

export default Ethereum
