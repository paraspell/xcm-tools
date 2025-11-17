// Contains detailed structure of XCM call construction for Astar Parachain

import { isForeignAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { ChainNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { transferXTokens } from '../../pallets/xTokens'
import type { TSerializedExtrinsics, TTransferLocalOptions } from '../../types'
import {
  type IPolkadotXCMTransfer,
  type IXTokensTransfer,
  type TPolkadotXCMTransferOptions,
  type TSendInternalOptions,
  type TXTokensTransferOptions
} from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class Astar<TApi, TRes>
  extends Parachain<TApi, TRes>
  implements IPolkadotXCMTransfer, IXTokensTransfer
{
  constructor() {
    super('Astar', 'astar', 'Polkadot', Version.V5)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    return transferPolkadotXcm(input, 'limited_reserve_transfer_assets', 'Unlimited')
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    if (!isForeignAsset(asset) || !asset.assetId) {
      return transferXTokens(input, undefined)
    }

    return transferXTokens(input, BigInt(asset.assetId))
  }

  canUseXTokens({ assetInfo }: TSendInternalOptions<TApi, TRes>): boolean {
    return assetInfo.symbol !== this.getNativeAssetSymbol()
  }

  transferRelayToPara(): Promise<TSerializedExtrinsics> {
    throw new ChainNotSupportedError()
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    assertHasId(asset)

    const assetId = Number(asset.assetId)
    const dest = { Id: address }

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: assetId,
          dest,
          keep_alive: false
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: 'transfer',
      params: {
        id: assetId,
        target: dest,
        amount: asset.amount
      }
    })
  }
}

export default Astar
