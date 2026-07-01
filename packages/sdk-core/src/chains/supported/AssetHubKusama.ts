// Contains detailed structure of XCM call construction for AssetHubKusama Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { getSubstrateChainImpl } from '../getChainInstance'
import SubstrateChain from '../SubstrateChain'

class AssetHubKusama<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('AssetHubKusama', 'KusamaAssetHub', 'Kusama', Version.V5)
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    const { assetInfo: asset, scenario } = input

    if (scenario === 'ParaToPara' && asset.symbol === 'DOT' && asset.assetId === undefined) {
      throw new ScenarioNotSupportedError(
        'Bridged DOT cannot currently be transfered from AssetHubKusama, if you are sending different DOT asset, please specify {id: <DOTID>}.'
      )
    }

    return transferPolkadotXcm(input)
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    return getSubstrateChainImpl<TApi, TRes, TSigner, TCustomChain>(
      'AssetHubPolkadot'
    ).transferLocalNonNativeAsset(options)
  }

  getBalanceForeign(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    return getSubstrateChainImpl<TApi, TRes, TSigner, TCustomChain>(
      'AssetHubPolkadot'
    ).getBalanceForeign(api, address, asset)
  }
}

export default AssetHubKusama
