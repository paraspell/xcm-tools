// Contains detailed structure of XCM call construction for Manta Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TMantaAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Manta<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Manta', 'manta', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currencyID } = input
    const currencySelection: TMantaAsset = {
      MantaCurrency: currencyID ? BigInt(currencyID) : undefined
    }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Manta
