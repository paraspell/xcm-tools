// Contains detailed structure of XCM call construction for Quartz Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { getChain } from '../../utils'
import SubstrateChain from '../SubstrateChain'

class Quartz<TApi, TRes, TSigner>
  extends SubstrateChain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Quartz', 'quartz', 'Kusama', Version.V5)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    return getChain<TApi, TRes, TSigner, 'Unique'>('Unique').transferLocalNonNativeAsset(options)
  }

  getBalanceForeign<TApi, TRes, TSigner>(
    api: PolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    return getChain<TApi, TRes, TSigner, 'Unique'>('Unique').getBalanceForeign(api, address, asset)
  }

  isSendingTempDisabled(): boolean {
    return true
  }
}

export default Quartz
