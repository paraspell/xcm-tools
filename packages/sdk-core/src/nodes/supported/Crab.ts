// Contains detailed structure of XCM call construction for Crab Parachain

import type { TAsset } from '@paraspell/assets'
import { Parents } from '@paraspell/sdk-common'

import { NodeNotSupportedError } from '../../errors'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import { createVersionedMultiAssets } from '../../pallets/xcmPallet/utils'
import type { TTransferLocalOptions } from '../../types'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TScenario,
  type TSerializedApiCall,
  Version
} from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

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

  createCurrencySpec(amount: string, scenario: TScenario, version: Version, _asset?: TAsset) {
    if (scenario === 'ParaToPara') {
      return createVersionedMultiAssets(version, amount, {
        parents: Parents.ZERO,
        interior: {
          X1: {
            PalletInstance: 5
          }
        }
      })
    } else {
      return super.createCurrencySpec(amount, scenario, version)
    }
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'Darwinia'>('Darwinia').transferLocalNonNativeAsset(options)
  }
}

export default Crab
