// Contains detailed structure of XCM call construction for AssetHubKusama Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { isForeignAsset } from '@paraspell/assets'
import { isTLocation, isTrustedChain, Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  TDestination,
  TPolkadotXcmMethod,
  TRelayToParaOverrides,
  TTransferLocalOptions
} from '../../types'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TScenario
} from '../../types'
import { getChain } from '../../utils'
import Parachain from '../Parachain'

class AssetHubKusama<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('AssetHubKusama', 'KusamaAssetHub', 'Kusama', Version.V5)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { destination, assetInfo: asset, scenario } = input
    // TESTED https://kusama.subscan.io/xcm_message/kusama-ddc2a48f0d8e0337832d7aae26f6c3053e1f4ffd
    // TESTED https://kusama.subscan.io/xcm_message/kusama-8e423130a4d8b61679af95dbea18a55124f99672

    if (scenario === 'ParaToPara' && asset.symbol === 'DOT' && !isForeignAsset(asset)) {
      throw new ScenarioNotSupportedError(
        this.chain,
        scenario,
        'Bridged DOT cannot currently be transfered from AssetHubKusama, if you are sending different DOT asset, please specify {id: <DOTID>}.'
      )
    }

    const method = this.getMethod(scenario, destination)

    return transferPolkadotXcm(input, method, 'Unlimited')
  }

  getMethod(scenario: TScenario, destination: TDestination): TPolkadotXcmMethod {
    const isTrusted = !isTLocation(destination) && isTrustedChain(destination)

    if (destination === 'IntegriteeKusama') return 'transfer_assets'

    return scenario === 'ParaToPara' && !isTrusted
      ? 'limited_reserve_transfer_assets'
      : 'limited_teleport_assets'
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { transferType: 'teleport' }
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
