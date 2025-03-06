// Contains detailed structure of XCM call construction for Karura Parachain

import { type IXTokensTransfer, type TXTokensTransferOptions, Version } from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class Karura<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Karura', 'karura', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'Acala'>('Acala').transferXTokens(input)
  }
}

export default Karura
