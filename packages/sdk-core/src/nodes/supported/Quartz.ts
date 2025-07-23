// Contains detailed structure of XCM call construction for Quartz Parachain

import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import ParachainNode from '../ParachainNode'

class Quartz<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  private static NATIVE_ASSET_ID = 0

  constructor() {
    super('Quartz', 'quartz', 'kusama', Version.V5)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    if (asset.symbol === this.getNativeAssetSymbol()) {
      return transferXTokens(input, Quartz.NATIVE_ASSET_ID)
    }

    assertHasId(asset)

    return transferXTokens(input, Number(asset.assetId))
  }
}

export default Quartz
