// Contains detailed structure of XCM call construction for CoretimeKusama Parachain

import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import Chain from '../Chain'

class CoretimeKusama<TApi, TRes> extends Chain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('CoretimeKusama', 'kusamaCoretime', 'Kusama', Version.V5)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario } = input

    if (scenario === 'ParaToPara') {
      throw new ScenarioNotSupportedError({ chain: this.chain, scenario })
    }

    return transferPolkadotXcm(input)
  }
}

export default CoretimeKusama
