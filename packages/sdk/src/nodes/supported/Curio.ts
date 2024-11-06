// Contains detailed structure of XCM call construction for Curio Parachain

import type { TForeignOrTokenAsset } from '../../types'
import { Version, type IXTokensTransfer, type XTokensTransferInput } from '../../types'
import { isForeignAsset } from '../../utils/assets'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Curio<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Curio', 'curio', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { asset } = input
    const currencySelection: TForeignOrTokenAsset = isForeignAsset(asset)
      ? { ForeignAsset: Number(asset.assetId) }
      : { Token: asset.symbol }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Curio
