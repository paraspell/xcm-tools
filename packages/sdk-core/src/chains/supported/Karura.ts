// Contains detailed structure of XCM call construction for Karura Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import type { TForeignOrTokenAsset } from '../../types'
import Acala from './Acala'

class Karura<TApi, TRes, TSigner, TCustomChain extends string = never> extends Acala<
  TApi,
  TRes,
  TSigner,
  TCustomChain
> {
  constructor() {
    super('Karura', 'karura', 'Kusama', Version.V5)
  }

  getCustomCurrencyId(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ): TForeignOrTokenAsset {
    // aSEED is registered as Token(KUSD) on Karura
    return asset.symbol === 'aSEED' ? { Token: 'KUSD' } : super.getCustomCurrencyId(api, asset)
  }
}

export default Karura
