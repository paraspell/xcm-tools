// Contains detailed structure of XCM call construction for Xode Parachain

import type { TChain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { assertHasId } from '../../utils'
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

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    const { api, assetInfo: asset, recipient, isAmountAll, keepAlive } = options

    assertHasId(asset)

    const assetId = Number(asset.assetId)
    const dest = { Id: recipient }

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: assetId,
          dest,
          keep_alive: keepAlive
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        id: assetId,
        target: dest,
        amount: asset.amount
      }
    })
  }
}

export default Xode
