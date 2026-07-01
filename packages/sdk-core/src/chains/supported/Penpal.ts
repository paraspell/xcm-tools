import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getPalletInstance } from '../../pallets'
import Moonbeam from './Moonbeam'

class Penpal<TApi, TRes, TSigner, TCustomChain extends string = never> extends Moonbeam<
  TApi,
  TRes,
  TSigner,
  TCustomChain
> {
  constructor() {
    super('Penpal', 'westendPenpal', 'Westend', Version.V4)
  }

  getBalanceForeign(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    return getPalletInstance('ForeignAssets').getBalance(api, address, asset)
  }
}

export default Penpal
