//Contains detailed structure of XCM call construction for ComposableFinance Parachain

import ParachainNode from '../ParachainNode'

class ComposableFinance extends ParachainNode {
  constructor() {
    super('ComposableFinance', 'composableFinance', 'polkadot')
  }
}

export default ComposableFinance
