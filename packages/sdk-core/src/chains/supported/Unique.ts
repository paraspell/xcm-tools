// Contains detailed structure of XCM call construction for Unique Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { assertHasId } from '../../utils'
import { getLocalTransferAmount } from '../../utils/transfer'
import SubstrateChain from '../SubstrateChain'

const FUNGIBLE_ITEM_ID = 0

class Unique<TApi, TRes, TSigner>
  extends SubstrateChain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Unique', 'unique', 'Polkadot', Version.V5)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, recipient } = options

    assertHasId(asset)

    const amount = getLocalTransferAmount(options)

    return api.deserializeExtrinsics({
      module: 'Unique',
      method: 'transfer',
      params: {
        recipient: { Substrate: recipient },
        collection_id: Number(asset.assetId),
        item_id: FUNGIBLE_ITEM_ID,
        value: amount
      }
    })
  }

  async getBalanceForeign<TApi, TRes, TSigner>(
    api: PolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    assertHasId(asset)

    const balance = await api.queryRuntimeApi<{ success: boolean; value: bigint; ok: bigint }>({
      module: 'UniqueApi',
      method: 'balance',
      params: [Number(asset.assetId), { Substrate: address }, FUNGIBLE_ITEM_ID]
    })

    return balance?.value ?? (balance?.ok != undefined ? BigInt(balance.ok) : undefined) ?? 0n
  }
}

export default Unique
