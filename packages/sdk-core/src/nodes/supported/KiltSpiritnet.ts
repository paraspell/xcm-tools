// Contains detailed structure of XCM call construction for KiltSpiritnet Parachain

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TSerializedApiCall,
  Version
} from '../../types'
import ParachainNode from '../ParachainNode'

class KiltSpiritnet<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('KiltSpiritnet', 'kilt', 'polkadot', Version.V2)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
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
}

export default KiltSpiritnet
