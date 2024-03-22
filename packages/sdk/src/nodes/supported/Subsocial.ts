// Contains detailed structure of XCM call construction for Subsocial Parachain

import { Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Subsocial extends ParachainNode {
  constructor() {
    super('Subsocial', 'subsocial', 'polkadot', Version.V1)
  }
}

export default Subsocial
