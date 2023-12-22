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

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-e4cdf1c59ffbb3d504adbc893d6b7d72665e484d
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-c01158ff1a5c5a596138ed9d0f0f2bccc1d9c51d
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'limitedTeleportAssets', 'Unlimited')
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
