// Contains detailed structure of XCM call construction for OriginTrail Parachain

import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class NeuroWeb<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TParachain = 'NeuroWeb',
    info: string = 'neuroweb',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    return transferPolkadotXcm(input, 'limited_reserve_transfer_assets', 'Unlimited')
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): Promise<TRes> {
    const { api, assetInfo: asset, address, isAmountAll } = options

    if (isAmountAll) {
      return Promise.resolve(
        api.deserializeExtrinsics({
          module: 'Balances',
          method: 'transfer_all',
          params: {
            dest: address,
            keep_alive: false
          }
        })
      )
    }

    return Promise.resolve(
      api.deserializeExtrinsics({
        module: 'Balances',
        method: 'transfer_keep_alive',
        params: {
          dest: address,
          value: asset.amount
        }
      })
    )
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, balance, isAmountAll } = options

    assertHasId(asset)

    const assetId = BigInt(asset.assetId)

    const amount = isAmountAll ? balance : asset.amount

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: 'transfer',
      params: {
        id: assetId,
        target: address,
        amount
      }
    })
  }
}

export default NeuroWeb
