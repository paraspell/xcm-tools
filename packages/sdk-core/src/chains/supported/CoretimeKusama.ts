// Contains detailed structure of XCM call construction for CoretimeKusama Parachain

import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import Chain from '../Chain'

class CoretimeKusama<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('CoretimeKusama', 'kusamaCoretime', 'Kusama', Version.V5)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    const { scenario } = input

    if (scenario === 'ParaToPara') {
      throw new ScenarioNotSupportedError({ chain: this.chain, scenario })
    }

    return transferPolkadotXcm(input)
  }
}

export default CoretimeKusama
