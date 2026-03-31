// Contains detailed structure of XCM call construction for Robonomics Parachain

import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import type { TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Chain from '../Chain'

class RobonomicsPolkadot<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('RobonomicsPolkadot', 'robonomics', 'Polkadot', Version.V3)
  }

  transferPolkadotXCM(_input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    throw new ScenarioNotSupportedError(
      'Only local transfers and incoming cross-chain assets are supported.'
    )
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, recipient, isAmountAll, keepAlive } = options

    assertHasId(asset)

    const assetId = BigInt(asset.assetId)
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

export default RobonomicsPolkadot
