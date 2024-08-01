// Contains detailed structure of XCM call construction for AssetHubKusama Parachain

import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  type TScenario,
  type TRelayToParaInternalOptions,
  type TMultiAsset,
  type TMultiLocation
} from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'
import type AssetHubPolkadot from './AssetHubPolkadot'

class AssetHubKusama extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('AssetHubKusama', 'KusamaAssetHub', 'kusama', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    // TESTED https://kusama.subscan.io/xcm_message/kusama-ddc2a48f0d8e0337832d7aae26f6c3053e1f4ffd
    // TESTED https://kusama.subscan.io/xcm_message/kusama-8e423130a4d8b61679af95dbea18a55124f99672

    if (input.destination === 'AssetHubPolkadot') {
      return (getNode('AssetHubPolkadot') as AssetHubPolkadot).handleBridgeTransfer(
        input,
        'Polkadot'
      )
    }

    const { scenario } = input
    const method =
      scenario === 'ParaToPara' ? 'limitedReserveTransferAssets' : 'limitedTeleportAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, method, 'Unlimited')
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
