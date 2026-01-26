// Contains detailed structure of XCM call construction for BridgeHubKusama Parachain

import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import Chain from '../Chain'

class BridgeHubKusama<TApi, TRes> extends Chain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('BridgeHubKusama', 'kusamaBridgeHub', 'Kusama', Version.V5)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario } = input

    if (scenario === 'ParaToPara') {
      throw new ScenarioNotSupportedError(
        'Unable to use bridge hub for transfers to other Parachains. Please move your currency to AssetHub to transfer to other Parachains.'
      )
    }

    return transferPolkadotXcm(input)
  }
}

export default BridgeHubKusama
