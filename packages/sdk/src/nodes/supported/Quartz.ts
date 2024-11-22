// Contains detailed structure of XCM call construction for Quartz Parachain

import { Version, type IXTokensTransfer, type XTokensTransferInput } from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class Quartz<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Quartz', 'quartz', 'kusama', Version.V3)
  }

  _assetCheckEnabled = false

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'Unique'>('Unique').transferXTokens(input)
  }
}

export default Quartz
