// Contains detailed structure of XCM call construction for CoretimePolkadot Parachain

import { ScenarioNotSupportedError } from '../../errors'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import type { TTransferReturn } from '../../types'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type TSerializedApiCallV2,
  type TRelayToParaOptions
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class PeoplePolkadot<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('PeoplePolkadot', 'polkadotPeople', 'polkadot', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(
    input: PolkadotXCMTransferInput<TApi, TRes>
  ): Promise<TTransferReturn<TRes>> {
    const { scenario } = input
    if (scenario === 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }
    const section = 'limited_teleport_assets'
    return Promise.resolve(PolkadotXCMTransferImpl.transferPolkadotXCM(input, section, 'Unlimited'))
  }

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): TSerializedApiCallV2 {
    const { version = Version.V3 } = options
    return {
      module: 'XcmPallet',
      section: 'limited_teleport_assets',
      parameters: constructRelayToParaParameters(options, version, true)
    }
  }
}

export default PeoplePolkadot
