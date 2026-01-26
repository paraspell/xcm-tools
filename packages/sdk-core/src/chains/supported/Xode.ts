// Contains detailed structure of XCM call construction for Xode Parachain

import type { TChain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import Chain from '../Chain'

class Xode<TApi, TRes> extends Chain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Xode', 'xode', 'Polkadot', Version.V4)
  }

  transferPolkadotXCM<TApi, TRes>(options: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { destChain, scenario } = options

    if (destChain !== 'AssetHubPolkadot' && scenario === 'ParaToPara') {
      throw new ScenarioNotSupportedError(
        'Xode chain only supports transfers to / from AssetHubPolkadot'
      )
    }

    return transferPolkadotXcm(options)
  }

  canReceiveFrom(origin: TChain): boolean {
    return origin === 'AssetHubPolkadot'
  }
}

export default Xode
