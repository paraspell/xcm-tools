// Contains detailed structure of XCM call construction for OriginTrail Parachain

import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Chain from '../Chain'

class NeuroWeb<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'NeuroWeb',
    info: string = 'neuroweb',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): Promise<TRes> {
    const { api, assetInfo: asset, address, isAmountAll, keepAlive } = options

    if (isAmountAll) {
      return Promise.resolve(
        api.deserializeExtrinsics({
          module: 'Balances',
          method: 'transfer_all',
          params: {
            dest: address,
            keep_alive: keepAlive
          }
        })
      )
    }

    return Promise.resolve(
      api.deserializeExtrinsics({
        module: 'Balances',
        method: keepAlive ? 'transfer_keep_alive' : 'transfer_allow_death',
        params: {
          dest: address,
          value: asset.amount
        }
      })
    )
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, address, balance, isAmountAll, keepAlive } = options

    assertHasId(asset)

    const assetId = BigInt(asset.assetId)

    const amount = isAmountAll ? balance : asset.amount

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        id: assetId,
        target: address,
        amount
      }
    })
  }
}

export default NeuroWeb
