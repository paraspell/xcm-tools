// Contains detailed structure of XCM call construction for CrustShadow Parachain

import { type TAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TReserveAsset,
  type TXTokensTransferOptions
} from '../../types'
import { assertHasId, getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class CrustShadow<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('CrustShadow', 'shadow', 'kusama', Version.V3)
  }

  private getCurrencySelection(asset: TAsset): TReserveAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) {
      return 'SelfReserve'
    }

    assertHasId(asset)

    return { OtherReserve: BigInt(asset.assetId) }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'Crust'>('Crust').transferLocalNonNativeAsset(options)
  }
}

export default CrustShadow
