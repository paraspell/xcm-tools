// Contains detailed structure of XCM call construction for Encoiter Parachain

import { isTrustedChain, Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import SubstrateChain from '../SubstrateChain'

class Encointer<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Encointer', 'encointer', 'Kusama', Version.V5)
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    const { destChain } = input

    if (input.scenario === 'ParaToRelay' || (destChain && isTrustedChain(destChain))) {
      return transferPolkadotXcm(input)
    }

    throw new ScenarioNotSupportedError({ chain: this.chain, scenario: input.scenario })
  }
}

export default Encointer
