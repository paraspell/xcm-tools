// Contains detailed structure of XCM call construction for Litentry Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TSelfReserveAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Litentry extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Litentry', 'litentry', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const currencySelection: TSelfReserveAsset = 'SelfReserve'
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Litentry
