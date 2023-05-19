//Contains detailed structure of XCM call construction for Bajun Parachain

import ParachainNode from '../ParachainNode'

class Bajun extends ParachainNode {
  constructor() {
    super('Bajun', 'bajun', 'kusama')
  }
}

export default Bajun
