// Contains detailed structure of XCM call construction for Bitgreen Parachain

import { Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Bitgreen extends ParachainNode {
  constructor() {
    super('Bitgreen', 'bitgreen', 'polkadot', Version.V1)
  }
}

export default Bitgreen
