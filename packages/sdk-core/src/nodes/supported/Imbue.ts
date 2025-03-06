// Contains detailed structure of XCM call construction for Imbue Parachain

import XTokensTransferImpl from '../../pallets/xTokens'
import { type IXTokensTransfer, type TXTokensTransferOptions, Version } from '../../types'
import ParachainNode from '../ParachainNode'

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
