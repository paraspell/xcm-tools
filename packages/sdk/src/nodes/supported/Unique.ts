// Contains detailed structure of XCM call construction for Unique Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TForeignAssetId
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Unique<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Unique', 'unique', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currencyID } = input
    const currencySelection: TForeignAssetId = { ForeignAssetId: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Unique
