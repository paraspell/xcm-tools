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
import { getSubstrateChainImpl } from '../getChainInstance'
import SubstrateChain from '../SubstrateChain'

class Quartz<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Quartz', 'quartz', 'Kusama', Version.V5)
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    return getSubstrateChainImpl<TApi, TRes, TSigner, TCustomChain>(
      'Unique'
    ).transferLocalNonNativeAsset(options)
  }

  getBalanceForeign(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    return getSubstrateChainImpl<TApi, TRes, TSigner, TCustomChain>('Unique').getBalanceForeign(
      api,
      address,
      asset
    )
  }

  isSendingTempDisabled(): boolean {
    return true
  }
}

export default Quartz
