// Contains detailed structure of XCM call construction for Encoiter Parachain

import { isTrustedChain, Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import Parachain from '../Parachain'

class Encointer<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Encointer', 'encointer', 'Kusama', Version.V5)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { destChain } = input

    if (input.scenario === 'ParaToRelay' || (destChain && isTrustedChain(destChain))) {
      return transferPolkadotXcm(input)
    }

    throw new ScenarioNotSupportedError({ chain: this.chain, scenario: input.scenario })
  }
}

export default Encointer
