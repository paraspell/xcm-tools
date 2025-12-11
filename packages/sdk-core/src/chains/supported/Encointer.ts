// Contains detailed structure of XCM call construction for Encoiter Parachain

import { isTrustedChain, Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TRelayToParaOverrides } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import Parachain from '../Parachain'

class Encointer<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Encointer', 'encointer', 'Kusama', Version.V5)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { destChain } = input
    // NO PARA TO PARA SCENARIOS ON SUBSCAN
    // TESTED https://encointer.subscan.io/xcm_message/kusama-418501e86e947b16c4e4e9040694017e64f9b162
    if (input.scenario === 'ParaToRelay' || (destChain && isTrustedChain(destChain))) {
      return transferPolkadotXcm(input, 'limited_teleport_assets', 'Unlimited')
    }
    throw new ScenarioNotSupportedError({ chain: this.chain, scenario: input.scenario })
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { transferType: 'teleport' }
  }
}

export default Encointer
