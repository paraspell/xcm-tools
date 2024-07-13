// Contains detailed structure of XCM call construction for Ethereum

import { Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Ethereum extends ParachainNode {
  constructor() {
    super('Ethereum', 'ethereum', 'polkadot', Version.V3)
  }
}

export default Ethereum
