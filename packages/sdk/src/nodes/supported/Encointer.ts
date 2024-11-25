// Contains detailed structure of XCM call construction for Encoiter Parachain

import type { TRelayToParaOverrides } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions, Version } from '../../types'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class Encointer<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Encointer', 'encointer', 'kusama', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    // NO PARA TO PARA SCENARIOS ON SUBSCAN
    // TESTED https://encointer.subscan.io/xcm_message/kusama-418501e86e947b16c4e4e9040694017e64f9b162
    if (input.scenario === 'ParaToRelay') {
      return Promise.resolve(
        PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'limited_teleport_assets', 'Unlimited')
      )
    }
    throw new ScenarioNotSupportedError(this.node, input.scenario)
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { section: 'limited_teleport_assets', includeFee: true }
  }
}

export default Encointer
