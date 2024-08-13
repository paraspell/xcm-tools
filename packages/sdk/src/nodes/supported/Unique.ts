// Contains detailed structure of XCM call construction for Unique Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TForeignAssetId
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Unique extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Unique', 'unique', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID } = input
    const currencySelection: TForeignAssetId = { ForeignAssetId: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Unique
