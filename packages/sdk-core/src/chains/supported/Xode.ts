// Contains detailed structure of XCM call construction for Xode Parachain

import type { TChain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { IncompatibleChainsError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import { assertHasLocation, createAsset } from '../../utils'
import Parachain from '../Parachain'

class Xode<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Xode', 'xode', 'Polkadot', Version.V4)
  }

  transferPolkadotXCM<TApi, TRes>(options: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { destChain, assetInfo, scenario } = options

    if (destChain !== 'AssetHubPolkadot' && scenario === 'ParaToPara') {
      throw new IncompatibleChainsError(
        'Xode chain only supports transfers to / from AssetHubPolkadot'
      )
    }

    assertHasLocation(assetInfo)

    return transferPolkadotXcm(
      {
        ...options,
        asset: createAsset(this.version, assetInfo.amount, assetInfo.location)
      },
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  }

  canReceiveFrom(origin: TChain): boolean {
    return origin === 'AssetHubPolkadot'
  }
}

export default Xode
