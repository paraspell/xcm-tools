// Contains detailed structure of XCM call construction for Unique Parachain

import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import ParachainNode from '../ParachainNode'

class Unique<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  private static NATIVE_ASSET_ID = 0

  constructor() {
    super('Unique', 'unique', 'polkadot', Version.V4)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    if (asset.symbol === this.getNativeAssetSymbol()) {
      return transferXTokens(input, Unique.NATIVE_ASSET_ID)
    }

    assertHasId(asset)

    return transferXTokens(input, Number(asset.assetId))
  }

  transferLocalNonNativeAsset(_options: TTransferLocalOptions<TApi, TRes>): TRes {
    throw new ScenarioNotSupportedError(
      this.node,
      'ParaToPara',
      `${this.node} does not support foreign assets local transfers`
    )
  }
}

export default Unique
