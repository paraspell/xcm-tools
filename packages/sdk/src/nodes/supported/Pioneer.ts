// Contains detailed structure of XCM call construction for Pioneer Parachain

import {
  type IXTokensTransfer,
  Version,
  type TXTokensTransferOptions,
  type TNativeTokenAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Pioneer<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Pioneer', 'pioneer', 'kusama', Version.V1)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    // Multiple asset options needs addressing
    const { fees } = input
    const currencySelection: TNativeTokenAsset = 'NativeToken'
    return XTokensTransferImpl.transferXTokens(input, currencySelection, fees)
  }
}

export default Pioneer
