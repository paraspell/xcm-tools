// Contains detailed structure of XCM call construction for Crab Parachain

import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import Chain from '../Chain'

class Crab<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Crab', 'crab', 'Kusama', Version.V4)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    if (input.scenario === 'ParaToPara') return transferPolkadotXcm(input)
    throw new ScenarioNotSupportedError({ chain: this.chain, scenario: input.scenario })
  }

  isRelayToParaEnabled(): boolean {
    return false
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    return getChain<TApi, TRes, TSigner, 'Darwinia'>('Darwinia').transferLocalNonNativeAsset(
      options
    )
  }
}

export default Crab
