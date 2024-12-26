// Contains detailed structure of XCM call construction for Acala Parachain

import {
  type IXTokensTransfer,
  type TForeignOrTokenAsset,
  Version,
  type TXTokensTransferOptions
} from '../../types'
import { isForeignAsset } from '../../utils/assets'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Acala<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Acala', 'acala', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection: TForeignOrTokenAsset = isForeignAsset(asset)
      ? { ForeignAsset: Number(asset.assetId) }
      : { Token: asset.symbol }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Acala
