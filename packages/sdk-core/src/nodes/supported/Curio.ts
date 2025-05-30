// Contains detailed structure of XCM call construction for Curio Parachain

import { isForeignAsset } from '@paraspell/assets'

import { transferXTokens } from '../../pallets/xTokens'
import type { TForeignOrTokenAsset } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions, Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Curio<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Curio', 'curio', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection: TForeignOrTokenAsset = isForeignAsset(asset)
      ? { ForeignAsset: Number(asset.assetId) }
      : { Token: asset.symbol }
    return transferXTokens(input, currencySelection)
  }
}

export default Curio
