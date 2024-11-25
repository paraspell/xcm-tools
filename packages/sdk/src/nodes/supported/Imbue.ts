// Contains detailed structure of XCM call construction for Imbue Parachain

import { type IXTokensTransfer, Version, type TXTokensTransferOptions } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Imbue<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Imbue', 'imbue', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    return XTokensTransferImpl.transferXTokens(input, asset.symbol)
  }
}

export default Imbue
