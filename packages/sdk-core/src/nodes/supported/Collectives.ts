// Contains detailed structure of XCM call construction for Collectives Parachain

import { ScenarioNotSupportedError } from '../../errors'
import type { TAsset, TRelayToParaOverrides } from '../../types'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  Version,
  type TScenario
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class Collectives<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Collectives', 'polkadotCollectives', 'polkadot', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario } = input
    if (scenario === 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }
    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'limited_teleport_assets', 'Unlimited')
    )
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { section: 'limited_teleport_assets', includeFee: true }
  }

  createCurrencySpec(amount: string, scenario: TScenario, version: Version, asset?: TAsset) {
    if (scenario === 'ParaToPara') {
      return {}
    } else {
      return super.createCurrencySpec(amount, scenario, version, asset)
    }
  }
}

export default Collectives
