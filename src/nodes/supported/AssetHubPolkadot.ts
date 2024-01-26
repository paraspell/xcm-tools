// Contains detailed structure of XCM call construction for Statemint Parachain

import { constructRelayToParaParameters, createCurrencySpec } from '../../pallets/xcmPallet/utils'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  type TTransferRelayToParaOptions,
  Parents,
  type TScenario
} from '../../types'
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

  transferRelayToPara(options: TTransferRelayToParaOptions): TSerializedApiCall {
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
    currencyId?: string
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
      return createCurrencySpec(amount, version, Parents.ZERO, interior)
    } else {
      return super.createCurrencySpec(amount, scenario, version, currencyId)
    }
  }
}

export default AssetHubPolkadot
