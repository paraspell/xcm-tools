// Contains detailed structure of XCM call construction for Curio Parachain

import type { TForeignOrTokenAsset } from '../../types'
import { Version, type IXTokensTransfer, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Curio<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Curio', 'curio', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currencyID, currency } = input
    const currencySelection: TForeignOrTokenAsset = currencyID
      ? { ForeignAsset: Number(currencyID) }
      : { Token: currency }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Curio
