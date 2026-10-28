// Contains detailed structure of XCM call construction for Pendulum Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { transferXTokens } from '../../pallets/xTokens'
import type { IXTokensTransfer, TXcmAsset, TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import SubstrateChain from '../SubstrateChain'

class Pendulum<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IXTokensTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Pendulum', 'pendulum', 'Polkadot', Version.V3)
  }

  getCustomCurrencyId(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ): TXcmAsset {
    if (asset.symbol === this.getNativeAssetSymbol(api)) return { Native: null }
    assertHasId(asset)
    return { XCM: Number(asset.assetId) }
  }

  transferXTokens(input: TXTokensTransferOptions<TApi, TRes, TSigner, TCustomChain>) {
    const { asset, api } = input

    const currencySelection = this.getCustomCurrencyId(api, asset)

    return transferXTokens(
      {
        ...input,
        useMultiAssetTransfer: asset.symbol === 'DOT'
      },
      currencySelection
    )
  }

  protected getLocalCurrencyId(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ): TXcmAsset {
    return this.getCustomCurrencyId(api, asset)
  }
}

export default Pendulum
