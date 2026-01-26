// Contains detailed structure of XCM call construction for Crab Parachain

import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import Chain from '../Chain'

class Crab<TApi, TRes> extends Chain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Crab', 'crab', 'Kusama', Version.V4)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    if (input.scenario === 'ParaToPara') return transferPolkadotXcm(input)
    throw new ScenarioNotSupportedError({ chain: this.chain, scenario: input.scenario })
  }

  isRelayToParaEnabled(): boolean {
    return false
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getChain<TApi, TRes, 'Darwinia'>('Darwinia').transferLocalNonNativeAsset(options)
  }
}

export default Crab
