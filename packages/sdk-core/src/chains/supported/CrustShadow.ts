// Contains detailed structure of XCM call construction for CrustShadow Parachain

import { type TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TReserveAsset,
  type TXTokensTransferOptions
} from '../../types'
import { assertHasId, getChain } from '../../utils'
import Parachain from '../Parachain'

class CrustShadow<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('CrustShadow', 'shadow', 'Kusama', Version.V3)
  }

  private getCurrencySelection(asset: TAssetInfo): TReserveAsset {
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
    return getChain<TApi, TRes, 'Crust'>('Crust').transferLocalNonNativeAsset(options)
  }
}

export default CrustShadow
