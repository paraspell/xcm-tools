import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { getPalletInstance } from '../../pallets'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import SubstrateChain from '../SubstrateChain'

class Penpal<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Penpal', 'westendPenpal', 'Westend', Version.V4)
  }

  transferPolkadotXCM(
    options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    return transferPolkadotXcm(options)
  }

  transferLocalNonNativeAsset(
    _options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    throw new ScenarioNotSupportedError(
      `${this.chain} local transfers are supported only from EVM Builder`
    )
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
