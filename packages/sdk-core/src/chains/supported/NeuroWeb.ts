// Contains detailed structure of XCM call construction for OriginTrail Parachain

import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TMintConfig, TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import SubstrateChain from '../SubstrateChain'

class NeuroWeb<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor(
    chain: TParachain = 'NeuroWeb',
    info: string = 'neuroweb',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, ecosystem, version)
  }

  protected getMintConfig(): TMintConfig {
    return { useIdPrefix: false, useBigIntId: true }
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  transferLocalNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    const { api, assetInfo: asset, recipient, isAmountAll, keepAlive } = options

    if (isAmountAll) {
      return Promise.resolve(
        api.deserializeExtrinsics({
          module: 'Balances',
          method: 'transfer_all',
          params: {
            dest: recipient,
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
          dest: recipient,
          value: asset.amount
        }
      })
    )
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    const { api, assetInfo: asset, recipient, isAmountAll, keepAlive } = options

    const module = asset.assetId === undefined ? 'ForeignAssets' : 'Assets'
    const id = asset.assetId === undefined ? asset.location : BigInt(asset.assetId)

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module,
        method: 'transfer_all',
        params: {
          id,
          dest: recipient,
          keep_alive: keepAlive
        }
      })
    }

    return api.deserializeExtrinsics({
      module,
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        id,
        target: recipient,
        amount: asset.amount
      }
    })
  }
}

export default NeuroWeb
