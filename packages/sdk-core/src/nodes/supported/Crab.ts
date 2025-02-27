// Contains detailed structure of XCM call construction for Crab Parachain

import type { TAsset } from '../../types'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  Version,
  type TSerializedApiCall,
  type TScenario
} from '../../types'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import { NodeNotSupportedError } from '../../errors'
import { getNode } from '../../utils'

class Crab<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Crab', 'crab', 'kusama', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    // TESTED https://kusama.subscan.io/xcm_message/kusama-ce7396ec470ba0c6516a50075046ee65464572dc
    if (input.scenario === 'ParaToPara') {
      return Promise.resolve(
        PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'reserve_transfer_assets')
      )
    }
    throw new ScenarioNotSupportedError(this.node, input.scenario)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }

  createCurrencySpec(amount: string, scenario: TScenario, version: Version, asset?: TAsset) {
    return getNode<TApi, TRes, 'Darwinia'>('Darwinia').createCurrencySpec(
      amount,
      scenario,
      version,
      asset
    )
  }
}

export default Crab
