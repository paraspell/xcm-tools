// Contains detailed structure of XCM call construction for Encoiter Parachain

import { isTrustedChain, Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import Chain from '../Chain'

class Encointer<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Encointer', 'encointer', 'Kusama', Version.V5)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    const { destChain } = input

    if (input.scenario === 'ParaToRelay' || (destChain && isTrustedChain(destChain))) {
      return transferPolkadotXcm(input)
    }

    throw new ScenarioNotSupportedError({ chain: this.chain, scenario: input.scenario })
  }
}

export default Encointer
