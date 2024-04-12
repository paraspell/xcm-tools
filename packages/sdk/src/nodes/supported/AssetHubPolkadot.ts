// Contains detailed structure of XCM call construction for Statemint Parachain

import { constructRelayToParaParameters, createCurrencySpec } from '../../pallets/xcmPallet/utils'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  Parents,
  type TScenario,
  type TRelayToParaInternalOptions
} from '../../types'
import { type TMultiLocation } from '../../types/TMultiLocation'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class AssetHubPolkadot extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('AssetHubPolkadot', 'PolkadotAssetHub', 'polkadot', Version.V3)
  }

  _assetCheckEnabled = false

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    const { scenario } = input
    const method =
      scenario === 'ParaToPara' ? 'limitedReserveTransferAssets' : 'limitedTeleportAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, method, 'Unlimited')
  }

  transferRelayToPara(options: TRelayToParaInternalOptions): TSerializedApiCall {
    return {
      module: 'xcmPallet',
      section: 'limitedTeleportAssets',
      parameters: constructRelayToParaParameters(options, Version.V3, true)
    }
  }

  createCurrencySpec(
    amount: string,
    scenario: TScenario,
    version: Version,
    currencyId?: string,
    overridedMultiLocation?: TMultiLocation
  ): any {
    if (scenario === 'ParaToPara') {
      const interior = {
        X2: [
          {
            PalletInstance: 50
          },
          {
            GeneralIndex: currencyId
          }
        ]
      }
      return createCurrencySpec(amount, version, Parents.ZERO, overridedMultiLocation, interior)
    } else {
      return super.createCurrencySpec(amount, scenario, version, currencyId)
    }
  }
}

export default AssetHubPolkadot
