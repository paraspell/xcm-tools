// Contains detailed structure of XCM call construction for Hydration Parachain

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Hydration<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Hydration', 'hydradx', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }
}

export default Hydration
