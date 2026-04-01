import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getPalletInstance } from '../../pallets'
import Moonbeam from './Moonbeam'

class Penpal<TApi, TRes, TSigner> extends Moonbeam<TApi, TRes, TSigner> {
  constructor() {
    super('Penpal', 'westendPenpal', 'Westend', Version.V4)
  }

  getBalanceForeign<TApi, TRes, TSigner>(
    api: PolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    return getPalletInstance('ForeignAssets').getBalance(api, address, asset)
  }
}

export default Penpal
