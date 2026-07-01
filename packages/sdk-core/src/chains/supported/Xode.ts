// Contains detailed structure of XCM call construction for Xode Parachain

import type { TChain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import SubstrateChain from '../SubstrateChain'

class Xode<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Xode', 'xode', 'Polkadot', Version.V5)
  }

  transferPolkadotXCM(
    options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    const { destChain, scenario } = options

    if (destChain !== 'AssetHubPolkadot' && scenario === 'ParaToPara') {
      throw new ScenarioNotSupportedError(
        'Xode chain only supports transfers to / from AssetHubPolkadot'
      )
    }

    return transferPolkadotXcm(options)
  }

  canReceiveFrom<TCustomChain extends string = never>(origin: TChain | TCustomChain): boolean {
    return origin === 'AssetHubPolkadot'
  }
}

export default Xode
