// Contains detailed structure of XCM call construction for Turing Parachain

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Turing<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Turing', 'turing', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }
}

export default Turing
