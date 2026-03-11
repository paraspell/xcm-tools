// Contains detailed structure of XCM call construction for AssetHubKusama Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import Chain from '../Chain'

class AssetHubKusama<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('AssetHubKusama', 'KusamaAssetHub', 'Kusama', Version.V5)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    const { assetInfo: asset, scenario } = input

    if (scenario === 'ParaToPara' && asset.symbol === 'DOT' && asset.assetId === undefined) {
      throw new ScenarioNotSupportedError(
        'Bridged DOT cannot currently be transfered from AssetHubKusama, if you are sending different DOT asset, please specify {id: <DOTID>}.'
      )
    }

    return transferPolkadotXcm(input)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    return getChain<TApi, TRes, TSigner, 'AssetHubPolkadot'>(
      'AssetHubPolkadot'
    ).transferLocalNonNativeAsset(options)
  }

  getBalanceForeign<TApi, TRes, TSigner>(
    api: IPolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    return getChain<TApi, TRes, TSigner, 'AssetHubPolkadot'>('AssetHubPolkadot').getBalanceForeign(
      api,
      address,
      asset
    )
  }
}

export default AssetHubKusama
