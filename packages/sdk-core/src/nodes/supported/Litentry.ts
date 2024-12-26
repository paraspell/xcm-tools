// Contains detailed structure of XCM call construction for Litentry Parachain

import {
  type IXTokensTransfer,
  Version,
  type TXTokensTransferOptions,
  type TSelfReserveAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Litentry<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Litentry', 'litentry', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const currencySelection: TSelfReserveAsset = 'SelfReserve'
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Litentry
