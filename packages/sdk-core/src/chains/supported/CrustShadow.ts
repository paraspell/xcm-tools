// Contains detailed structure of XCM call construction for CrustShadow Parachain

import { type TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TReserveAsset,
  type TXTokensTransferOptions
} from '../../types'
import { assertHasId, getChain } from '../../utils'
import SubstrateChain from '../SubstrateChain'

class CrustShadow<TApi, TRes, TSigner>
  extends SubstrateChain<TApi, TRes, TSigner>
  implements IXTokensTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('CrustShadow', 'shadow', 'Kusama', Version.V3)
  }

  private getCurrencySelection(
    api: PolkadotApi<TApi, TRes, TSigner>,
    asset: TAssetInfo
  ): TReserveAsset {
    if (asset.symbol === this.getNativeAssetSymbol(api)) {
      return 'SelfReserve'
    }

    assertHasId(asset)

    return { OtherReserve: BigInt(asset.assetId) }
  }

  transferXTokens(input: TXTokensTransferOptions<TApi, TRes, TSigner>) {
    const { asset, api } = input
    const currencySelection = this.getCurrencySelection(api, asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    return getChain<TApi, TRes, TSigner, 'Crust'>('Crust').transferLocalNonNativeAsset(options)
  }
}

export default CrustShadow
