// Contains detailed structure of XCM call construction for Bajun Parachain

import { Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Bajun extends ParachainNode {
  constructor() {
    super('Bajun', 'bajun', 'kusama', Version.V1)
  }
}

export default Bajun
