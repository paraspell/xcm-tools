// Contains detailed structure of XCM call construction for Collectives Parachain

import { ScenarioNotSupportedError } from '../../errors'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  type TScenario,
  type TRelayToParaInternalOptions
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Collectives extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Collectives', 'polkadotCollectives', 'polkadot', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    const { scenario } = input
    if (scenario === 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'limitedTeleportAssets', 'Unlimited')
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
    currencyId?: string
  ): any {
    if (scenario === 'ParaToPara') {
      return {}
    } else {
      return super.createCurrencySpec(amount, scenario, version, currencyId)
    }
  }
}

export default Collectives
