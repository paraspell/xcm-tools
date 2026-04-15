// Contains detailed structure of XCM call construction for Unique Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { assertHasId } from '../../utils'
import Chain from '../Chain'

class Unique<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Unique', 'unique', 'Polkadot', Version.V5)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  transferLocalNonNativeAsset(_options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    throw new ScenarioNotSupportedError(
      `${this.chain} does not support foreign assets local transfers`
    )
  }

  async getBalanceForeign<TApi, TRes, TSigner>(
    api: PolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    assertHasId(asset)

    const collectionId = await api.queryState({
      module: 'ForeignAssets',
      method: 'ForeignAssetToCollection',
      params: [asset.location]
    })

    const balance = await api.queryRuntimeApi<{ success: boolean; value: bigint; ok: bigint }>({
      module: 'UniqueApi',
      method: 'balance',
      params: [collectionId, { Substrate: address }, Number(asset.assetId)]
    })

    return balance?.value ?? (balance?.ok != undefined ? BigInt(balance.ok) : undefined) ?? 0n
  }
}

export default Unique
