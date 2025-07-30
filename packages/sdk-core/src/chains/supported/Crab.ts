// Contains detailed structure of XCM call construction for Crab Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Parents, Version } from '@paraspell/sdk-common'

import { ChainNotSupportedError } from '../../errors'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TTransferLocalOptions } from '../../types'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TScenario,
  type TSerializedApiCall
} from '../../types'
import { createX1Payload, getChain } from '../../utils'
import { createAsset } from '../../utils/asset'
import Parachain from '../Parachain'

class Crab<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Crab', 'crab', 'kusama', Version.V4)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    if (input.scenario === 'ParaToPara') {
      return transferPolkadotXcm(input, 'limited_reserve_transfer_assets', 'Unlimited')
    }
    throw new ScenarioNotSupportedError(this.chain, input.scenario)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new ChainNotSupportedError()
  }

  createCurrencySpec(amount: bigint, scenario: TScenario, version: Version, _asset?: TAssetInfo) {
    if (scenario === 'ParaToPara') {
      return createAsset(version, amount, {
        parents: Parents.ZERO,
        interior: createX1Payload(version, {
          PalletInstance: 5
        })
      })
    } else {
      return super.createCurrencySpec(amount, scenario, version)
    }
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getChain<TApi, TRes, 'Darwinia'>('Darwinia').transferLocalNonNativeAsset(options)
  }
}

export default Crab
