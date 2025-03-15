// Contains detailed structure of XCM call construction for AssetHubKusama Parachain

import type { TAsset } from '@paraspell/assets'
import { isForeignAsset } from '@paraspell/assets'
import { isTMultiLocation } from '@paraspell/sdk-common'

import { SYSTEM_NODES_KUSAMA } from '../../constants'
import { ScenarioNotSupportedError } from '../../errors'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type { TRelayToParaOverrides } from '../../types'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TScenario,
  Version
} from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class AssetHubKusama<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('AssetHubKusama', 'KusamaAssetHub', 'kusama', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { destination, asset, scenario } = input
    // TESTED https://kusama.subscan.io/xcm_message/kusama-ddc2a48f0d8e0337832d7aae26f6c3053e1f4ffd
    // TESTED https://kusama.subscan.io/xcm_message/kusama-8e423130a4d8b61679af95dbea18a55124f99672

    if (destination === 'AssetHubPolkadot') {
      return Promise.resolve(getNode('AssetHubPolkadot').handleBridgeTransfer(input, 'Polkadot'))
    }

    const isSystemNode = !isTMultiLocation(destination) && SYSTEM_NODES_KUSAMA.includes(destination)

    if (
      scenario === 'ParaToPara' &&
      asset.symbol === 'KSM' &&
      !isForeignAsset(asset) &&
      !isSystemNode
    ) {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Para to Para scenarios for KSM transfer from AssetHub are not supported, you have to transfer KSM to Relay chain and transfer to destination chain from Relay chain.'
      )
    }

    if (scenario === 'ParaToPara' && asset.symbol === 'DOT' && !isForeignAsset(asset)) {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Bridged DOT cannot currently be transfered from AssetHubKusama, if you are sending different DOT asset, please specify {id: <DOTID>}.'
      )
    }

    const section =
      scenario === 'ParaToPara' && !isSystemNode
        ? 'limited_reserve_transfer_assets'
        : 'limited_teleport_assets'
    return Promise.resolve(PolkadotXCMTransferImpl.transferPolkadotXCM(input, section, 'Unlimited'))
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { section: 'limited_teleport_assets', includeFee: true }
  }

  createCurrencySpec(amount: string, scenario: TScenario, version: Version, asset?: TAsset) {
    return getNode('AssetHubPolkadot').createCurrencySpec(amount, scenario, version, asset)
  }
}

export default AssetHubKusama
