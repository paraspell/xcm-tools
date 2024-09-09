// Contains detailed structure of XCM call construction for AssetHubKusama Parachain

import { ScenarioNotSupportedError } from '../../errors'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type TSerializedApiCall,
  type TScenario,
  type TRelayToParaInternalOptions,
  type TMultiAsset,
  type TMultiLocation
} from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class AssetHubKusama extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('AssetHubKusama', 'KusamaAssetHub', 'kusama', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    const { destination, currencySymbol, currencyId, scenario } = input
    // TESTED https://kusama.subscan.io/xcm_message/kusama-ddc2a48f0d8e0337832d7aae26f6c3053e1f4ffd
    // TESTED https://kusama.subscan.io/xcm_message/kusama-8e423130a4d8b61679af95dbea18a55124f99672

    if (destination === 'AssetHubPolkadot') {
      return getNode('AssetHubPolkadot').handleBridgeTransfer(input, 'Polkadot')
    }

    if (scenario === 'ParaToPara' && currencySymbol === 'KSM' && currencyId === undefined) {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Para to Para scenarios for KSM transfer from AssetHub are not supported, you have to transfer KSM to Relay chain and transfer to destination chain from Relay chain.'
      )
    }

    if (scenario === 'ParaToPara' && currencySymbol === 'DOT' && currencyId === undefined) {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Bridged DOT cannot currently be transfered from AssetHubKusama, if you are sending different DOT asset, please specify {id: <DOTID>}.'
      )
    }

    const section =
      scenario === 'ParaToPara' ? 'limitedReserveTransferAssets' : 'limitedTeleportAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, section, 'Unlimited')
  }

  transferRelayToPara(options: TRelayToParaInternalOptions): TSerializedApiCall {
    const { version = Version.V3 } = options
    return {
      module: 'xcmPallet',
      section: 'limitedTeleportAssets',
      parameters: constructRelayToParaParameters(options, version, true)
    }
  }

  createCurrencySpec(
    amount: string,
    scenario: TScenario,
    version: Version,
    currencyId?: string,
    overridedMultiLocation?: TMultiLocation | TMultiAsset[]
  ) {
    return getNode('AssetHubPolkadot').createCurrencySpec(
      amount,
      scenario,
      version,
      currencyId,
      overridedMultiLocation
    )
  }
}

export default AssetHubKusama
