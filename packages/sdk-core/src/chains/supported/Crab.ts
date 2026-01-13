// Contains detailed structure of XCM call construction for Crab Parachain

import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TTransferLocalOptions } from '../../types'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TSerializedExtrinsics
} from '../../types'
import { getChain } from '../../utils'
import Parachain from '../Parachain'

class Crab<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Crab', 'crab', 'Kusama', Version.V4)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    if (input.scenario === 'ParaToPara') return transferPolkadotXcm(input)
    throw new ScenarioNotSupportedError({ chain: this.chain, scenario: input.scenario })
  }

  transferRelayToPara(): Promise<TSerializedExtrinsics> {
    throw new ScenarioNotSupportedError({ chain: this.chain, scenario: 'RelayToPara' })
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getChain<TApi, TRes, 'Darwinia'>('Darwinia').transferLocalNonNativeAsset(options)
  }
}

export default Crab
