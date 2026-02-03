import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { getPalletInstance } from '../../pallets'
import Moonbeam from './Moonbeam'

class Penpal<TApi, TRes, TSigner> extends Moonbeam<TApi, TRes, TSigner> {
  constructor() {
    super('Penpal', 'westendPenpal', 'Westend', Version.V4)
  }

  getBalanceForeign<TApi, TRes, TSigner>(
    api: IPolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    return getPalletInstance('ForeignAssets').getBalance(api, address, asset)
  }
}

export default Penpal
