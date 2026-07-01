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
import { assertHasId } from '../../utils'
import { getSubstrateChainImpl } from '../getChainInstance'
import SubstrateChain from '../SubstrateChain'

class CrustShadow<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IXTokensTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('CrustShadow', 'shadow', 'Kusama', Version.V3)
  }

  private getCurrencySelection(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ): TReserveAsset {
    if (asset.symbol === this.getNativeAssetSymbol(api)) {
      return 'SelfReserve'
    }

    assertHasId(asset)

    return { OtherReserve: BigInt(asset.assetId) }
  }

  transferXTokens(input: TXTokensTransferOptions<TApi, TRes, TSigner, TCustomChain>) {
    const { asset, api } = input
    const currencySelection = this.getCurrencySelection(api, asset)
    return transferXTokens(input, currencySelection)
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    return getSubstrateChainImpl<TApi, TRes, TSigner, TCustomChain>(
      'Crust'
    ).transferLocalNonNativeAsset(options)
  }
}

export default CrustShadow
