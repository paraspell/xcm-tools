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

class AssetHubKusama<TApi, TRes> extends Chain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('AssetHubKusama', 'KusamaAssetHub', 'Kusama', Version.V5)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { assetInfo: asset, scenario } = input

    if (scenario === 'ParaToPara' && asset.symbol === 'DOT' && asset.assetId === undefined) {
      throw new ScenarioNotSupportedError(
        'Bridged DOT cannot currently be transfered from AssetHubKusama, if you are sending different DOT asset, please specify {id: <DOTID>}.'
      )
    }

    return transferPolkadotXcm(input)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getChain<TApi, TRes, 'AssetHubPolkadot'>('AssetHubPolkadot').transferLocalNonNativeAsset(
      options
    )
  }

  getBalanceForeign<TApi, TRes>(
    api: IPolkadotApi<TApi, TRes>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    return getChain<TApi, TRes, 'AssetHubPolkadot'>('AssetHubPolkadot').getBalanceForeign(
      api,
      address,
      asset
    )
  }
}

export default AssetHubKusama
