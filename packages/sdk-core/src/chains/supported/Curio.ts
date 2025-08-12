// Contains detailed structure of XCM call construction for Curio Parachain

import { isForeignAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TForeignOrTokenAsset } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import Parachain from '../Parachain'

class Curio<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Curio', 'curio', 'Kusama', Version.V3)
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
