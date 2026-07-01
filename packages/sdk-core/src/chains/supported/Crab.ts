// Contains detailed structure of XCM call construction for Crab Parachain

import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { getSubstrateChainImpl } from '../getChainInstance'
import SubstrateChain from '../SubstrateChain'

class Crab<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Crab', 'crab', 'Kusama', Version.V4)
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    if (input.scenario === 'ParaToPara') return transferPolkadotXcm(input)
    throw new ScenarioNotSupportedError({ chain: this.chain, scenario: input.scenario })
  }

  isRelayToParaEnabled(): boolean {
    return false
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    return getSubstrateChainImpl<TApi, TRes, TSigner, TCustomChain>(
      'Darwinia'
    ).transferLocalNonNativeAsset(options)
  }
}

export default Crab
