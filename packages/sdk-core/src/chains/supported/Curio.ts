// Contains detailed structure of XCM call construction for Curio Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TMintConfig, TPolkadotXCMTransferOptions } from '../../types'
import type { TForeignOrTokenAsset } from '../../types'
import { assertHasId } from '../../utils'
import SubstrateChain from '../SubstrateChain'

class Curio<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Curio', 'curio', 'Kusama', Version.V4)
  }

  getCustomCurrencyId(
    _api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ): TForeignOrTokenAsset {
    if (asset.isNative) return { Token: asset.symbol }

    assertHasId(asset)
    return { ForeignAsset: Number(asset.assetId) }
  }

  protected getLocalCurrencyId(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ): TForeignOrTokenAsset {
    return this.getCustomCurrencyId(api, asset)
  }

  protected getMintConfig(): TMintConfig {
    return { useCustomCurrencyId: true }
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    return transferPolkadotXcm(input)
  }
}

export default Curio
