// Contains detailed structure of XCM call construction for KiltSpiritnet Parachain

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import {
  Version,
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  type TSerializedApiCall
} from '../../types'
import { getNodeProviders } from '../config'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class KiltSpiritnet<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('KiltSpiritnet', 'kilt', 'polkadot', Version.V2)
  }

  transferPolkadotXCM<TApi, TRes>(input: PolkadotXCMTransferInput<TApi, TRes>): Promise<TRes> {
    if (input.scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, input.scenario)
    }
    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'reserve_transfer_assets')
    )
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getNodeProviders(this.node)[1]
  }
}

export default KiltSpiritnet
