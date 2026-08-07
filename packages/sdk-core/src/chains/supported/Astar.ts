// Contains detailed structure of XCM call construction for Astar Parachain

import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { deepEqual, Version } from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TMintConfig, TTransferInternalOptions, TTransferLocalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import SubstrateChain from '../SubstrateChain'

class Astar<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor(
    chain: TParachain = 'Astar',
    info: string = 'astar',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  protected getMintConfig(): TMintConfig {
    return { useBigIntId: true }
  }

  protected shouldUseReserveTransfer(): boolean {
    return true
  }

  isSendingTempDisabled({
    assetInfo
  }: TTransferInternalOptions<TApi, TRes, TSigner, TCustomChain>): boolean {
    return deepEqual(assetInfo.location, RELAY_LOCATION)
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    return transferPolkadotXcm(input, 'reserve_transfer_assets')
  }

  isRelayToParaEnabled(): boolean {
    return false
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

export default Astar
