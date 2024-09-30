// Contains detailed structure of XCM call construction for Polimec Parachain

import { Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Polimec extends ParachainNode {
  constructor() {
    super('Polimec', 'polimec', 'polkadot', Version.V3)
  }
}

export default Polimec
