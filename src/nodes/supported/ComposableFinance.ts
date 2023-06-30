// Contains detailed structure of XCM call construction for ComposableFinance Parachain

import { Version } from '../../types'
import ParachainNode from '../ParachainNode'

class ComposableFinance extends ParachainNode {
  constructor() {
    super('ComposableFinance', 'composableFinance', 'polkadot', Version.V3)
  }
}

export default ComposableFinance
